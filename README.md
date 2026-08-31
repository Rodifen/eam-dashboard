# EAM 实施进度日报仪表板

设备资产管理系统 (EAM) 每日实施进度跟踪与分析仪表板。

## 功能特性

- 📊 **总览仪表板** - 关键指标卡片、模块完成率、趋势图表、最近活动
- 🔍 **点检模块** - 点检任务管理、完成率追踪、问题跟踪
- 🔧 **保养模块** - 保养计划进度、任务状态管理
- 🚨 **报修模块** - 报修响应率、维修任务跟踪
- 🗄️ **数据源管理** - 演示数据/手动录入/SQL数据库切换
- 📝 **手动数据录入** - 单条录入和批量导入
- 🤖 **AI分析报告** - 基于数据自动生成实施进度分析和产品需求文档

## 技术栈

- **前端**: Vue 3 + Tailwind CSS + Vite + Pinia + Chart.js
- **后端**: Node.js + Express + better-sqlite3
- **部署**: Docker + Nginx

## 设计风格

深蓝色科技风格 - 暗色背景、蓝色强调色、玻璃拟态效果、发光边框

## 快速开始

### 开发模式

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install

# 启动后端 (终端1)
cd backend
npm run dev

# 启动前端 (终端2)
cd frontend
npm run dev
```

访问 http://localhost:5173

### Docker 部署

```bash
docker-compose up -d
```

访问 http://localhost:8080

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/dashboard/summary` | GET | 仪表板摘要 |
| `/api/dashboard/trend` | GET | 趋势数据 |
| `/api/dashboard/activity` | GET | 最近活动 |
| `/api/eam/:module` | GET | 模块详情 |
| `/api/eam/tasks/:id` | PUT | 更新任务 |
| `/api/datasource` | GET/POST | 数据源管理 |
| `/api/datasource/:id/activate` | POST | 激活数据源 |
| `/api/datasource/test-connection` | POST | 测试SQL连接 |
| `/api/manual-entry/progress` | POST | 提交进度 |
| `/api/manual-entry/batch` | POST | 批量导入 |
| `/api/ai/template` | GET | Prompt模板 |
| `/api/ai/generate` | POST | 生成分析报告 |

## 项目结构

```
eam-dashboard/
├── frontend/          # Vue 3 前端
│   ├── src/
│   │   ├── components/    # 可复用组件
│   │   ├── views/         # 页面视图
│   │   ├── stores/        # Pinia 状态管理
│   │   ├── api/           # API 服务层
│   │   └── router/        # Vue Router
│   └── ...
├── backend/           # Node.js 后端
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── models/        # 数据模型
│   │   └── middleware/    # 中间件
│   └── ...
├── docker-compose.yml
└── nginx.conf
```
