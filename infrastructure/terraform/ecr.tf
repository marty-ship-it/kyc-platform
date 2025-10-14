# ECR (Elastic Container Registry) Configuration

# ECR Repository for application images
resource "aws_ecr_repository" "app" {
  name                 = "${local.app_name}-${var.environment}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.ecr.arn
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.app_name}-ecr-${var.environment}"
    }
  )
}

# KMS Key for ECR encryption
resource "aws_kms_key" "ecr" {
  description             = "KMS key for ECR encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.app_name}-ecr-kms-${var.environment}"
    }
  )
}

resource "aws_kms_alias" "ecr" {
  name          = "alias/${local.app_name}-ecr-${var.environment}"
  target_key_id = aws_kms_key.ecr.key_id
}

# Lifecycle policy to clean up old images
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Keep last 3 untagged images"
        selection = {
          tagStatus   = "untagged"
          countType   = "imageCountMoreThan"
          countNumber = 3
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 3
        description  = "Expire images older than 30 days"
        selection = {
          tagStatus   = "any"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# IAM Policy for GitHub Actions to push images
resource "aws_iam_user" "github_actions" {
  name = "${local.app_name}-github-actions-${var.environment}"
  path = "/ci/"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.app_name}-github-actions-${var.environment}"
    }
  )
}

resource "aws_iam_user_policy" "github_actions_ecr" {
  name = "${local.app_name}-github-actions-ecr-${var.environment}"
  user = aws_iam_user.github_actions.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
          "ecr:DescribeImages"
        ]
        Resource = aws_ecr_repository.app.arn
      }
    ]
  })
}

# Additional policy for ECS deployments
resource "aws_iam_user_policy" "github_actions_ecs" {
  name = "${local.app_name}-github-actions-ecs-${var.environment}"
  user = aws_iam_user.github_actions.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition",
          "ecs:ListTaskDefinitions",
          "ecs:DescribeClusters"
        ]
        Resource = [
          aws_ecs_cluster.main.arn,
          aws_ecs_service.app.id,
          "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:task-definition/${local.app_name}-${var.environment}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.ecs_task_execution.arn,
          aws_iam_role.ecs_task.arn
        ]
      }
    ]
  })
}

# Access key for GitHub Actions (store in GitHub Secrets)
resource "aws_iam_access_key" "github_actions" {
  user = aws_iam_user.github_actions.name
}

# Store GitHub Actions credentials in Secrets Manager for reference
resource "aws_secretsmanager_secret" "github_actions_credentials" {
  name                    = "${local.app_name}-github-actions-credentials-${var.environment}"
  description             = "GitHub Actions IAM credentials"
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "github_actions_credentials" {
  secret_id = aws_secretsmanager_secret.github_actions_credentials.id
  secret_string = jsonencode({
    access_key_id     = aws_iam_access_key.github_actions.id
    secret_access_key = aws_iam_access_key.github_actions.secret
    region            = var.aws_region
    ecr_repository    = aws_ecr_repository.app.repository_url
  })
}
