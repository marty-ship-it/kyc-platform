# CloudWatch Monitoring and SNS Alerting

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name              = "${local.app_name}-alerts-${var.environment}"
  display_name      = "KYC Platform Alerts - ${var.environment}"
  kms_master_key_id = aws_kms_key.sns.id

  tags = local.common_tags
}

# KMS Key for SNS encryption
resource "aws_kms_key" "sns" {
  description             = "KMS key for SNS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.app_name}-sns-kms-${var.environment}"
    }
  )
}

resource "aws_kms_alias" "sns" {
  name          = "alias/${local.app_name}-sns-${var.environment}"
  target_key_id = aws_kms_key.sns.key_id
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.app_name}-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      # ECS CPU and Memory
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average", period = 300 }],
            [".", "MemoryUtilization", { stat = "Average", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ECS Service - CPU & Memory"
          period  = 300
        }
      },
      # RDS CPU and Connections
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", period = 300 }],
            [".", "DatabaseConnections", { stat = "Average", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "RDS - CPU & Connections"
          period  = 300
        }
      },
      # ALB Request Count and Response Time
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum", period = 300 }],
            [".", "TargetResponseTime", { stat = "Average", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ALB - Requests & Response Time"
          period  = 300
        }
      },
      # ALB HTTP Status Codes
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", { stat = "Sum", period = 300 }],
            [".", "HTTPCode_Target_4XX_Count", { stat = "Sum", period = 300 }],
            [".", "HTTPCode_Target_5XX_Count", { stat = "Sum", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ALB - HTTP Status Codes"
          period  = 300
        }
      },
      # RDS Storage and IOPS
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "FreeStorageSpace", { stat = "Average", period = 300 }],
            [".", "ReadIOPS", { stat = "Average", period = 300 }],
            [".", "WriteIOPS", { stat = "Average", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "RDS - Storage & IOPS"
          period  = 300
        }
      },
      # ECS Running Task Count
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "RunningTaskCount", { stat = "Average", period = 60 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ECS - Running Tasks"
          period  = 60
        }
      }
    ]
  })
}

# CloudWatch Log Insights Queries
resource "aws_cloudwatch_query_definition" "error_logs" {
  name = "${local.app_name}-error-logs-${var.environment}"

  log_group_names = [
    aws_cloudwatch_log_group.ecs.name
  ]

  query_string = <<-QUERY
    fields @timestamp, @message
    | filter @message like /ERROR/ or @message like /error/
    | sort @timestamp desc
    | limit 100
  QUERY
}

resource "aws_cloudwatch_query_definition" "slow_queries" {
  name = "${local.app_name}-slow-queries-${var.environment}"

  log_group_names = [
    aws_cloudwatch_log_group.ecs.name
  ]

  query_string = <<-QUERY
    fields @timestamp, @message
    | filter @message like /query.*ms/
    | parse @message /query.*(?<duration>\d+)ms/
    | filter duration > 1000
    | sort @timestamp desc
    | limit 50
  QUERY
}

resource "aws_cloudwatch_query_definition" "api_response_times" {
  name = "${local.app_name}-api-response-times-${var.environment}"

  log_group_names = [
    aws_cloudwatch_log_group.ecs.name
  ]

  query_string = <<-QUERY
    fields @timestamp, @message
    | filter @message like /GET/ or @message like /POST/
    | stats avg(@duration), max(@duration), min(@duration) by bin(5m)
  QUERY
}

# Composite Alarm for Application Health
resource "aws_cloudwatch_composite_alarm" "app_health" {
  alarm_name          = "${local.app_name}-app-health-${var.environment}"
  alarm_description   = "Composite alarm for overall application health"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  insufficient_data_actions = []

  alarm_rule = join(" OR ", [
    "ALARM(${aws_cloudwatch_metric_alarm.ecs_cpu_high.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.ecs_memory_high.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.rds_cpu.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.alb_unhealthy_hosts.alarm_name})"
  ])

  tags = local.common_tags
}

# X-Ray for distributed tracing (optional but recommended)
resource "aws_iam_role_policy_attachment" "ecs_task_xray" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# CloudWatch Logs Metric Filters
resource "aws_cloudwatch_log_metric_filter" "application_errors" {
  name           = "${local.app_name}-application-errors-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.ecs.name
  pattern        = "[time, request_id, level = ERROR*, ...]"

  metric_transformation {
    name      = "ApplicationErrors"
    namespace = "KYCPlatform/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_metric_alarm" "application_error_rate" {
  alarm_name          = "${local.app_name}-application-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApplicationErrors"
  namespace           = "KYCPlatform/${var.environment}"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Application error rate is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}
