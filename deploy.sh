#!/bin/bash
set -e

# EAM Dashboard 本地部署脚本
# 用法: ./deploy.sh [镜像来源: local|ghcr]

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
IMAGE_SOURCE="${1:-local}"

echo "🚀 EAM Dashboard 部署开始..."
echo "📁 项目目录: $REPO_DIR"
echo "📦 镜像来源: $IMAGE_SOURCE"

cd "$REPO_DIR"

# 拉取最新代码
echo ""
echo "📥 拉取最新代码..."
git pull origin main

if [ "$IMAGE_SOURCE" = "ghcr" ]; then
    # 从 GitHub Container Registry 拉取预构建镜像
    GHCR="ghcr.io/rodifen/eam-dashboard"
    echo ""
    echo "📦 拉取远程镜像..."
    docker pull "${GHCR}-frontend:latest"
    docker pull "${GHCR}-backend:latest"

    # 用远程镜像 tag 成本地名
    docker tag "${GHCR}-frontend:latest" eam-dashboard-frontend:latest
    docker tag "${GHCR}-backend:latest" eam-dashboard-backend:latest

    # 使用 ghcr compose override
    COMPOSE_FILE="-f docker-compose.yml -f docker-compose.ghcr.yml"
else
    # 本地构建
    echo ""
    echo "🔨 本地构建镜像..."
    COMPOSE_FILE=""
fi

# 停止旧容器 & 启动新容器
echo ""
echo "🔄 重启容器..."
docker compose $COMPOSE_FILE down
docker compose $COMPOSE_FILE up -d --build

# 清理悬空镜像
echo ""
echo "🧹 清理旧镜像..."
docker image prune -f

# 验证
echo ""
echo "✅ 部署完成！验证服务状态..."
docker compose $COMPOSE_FILE ps

echo ""
echo "🌐 访问地址: http://$(hostname -I | awk '{print $1}'):8080"
echo "📡 API 地址: http://$(hostname -I | awk '{print $1}'):3001/api/health"
