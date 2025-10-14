# KYC Platform - AWS Infrastructure as Code
# Terraform configuration for migrating from Railway to AWS

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for state management
  backend "s3" {
    bucket         = "kyc-platform-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ap-southeast-2"
    encrypt        = true
    dynamodb_table = "kyc-platform-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "kyc-platform"
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "github.com/marty-ship-it/kyc-platform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# Local variables
locals {
  app_name = "kyc-platform"
  common_tags = {
    Application = "Kycira AML/CTF Platform"
    Team        = "Compliance"
  }
}
