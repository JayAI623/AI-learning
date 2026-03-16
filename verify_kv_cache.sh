#!/bin/bash

echo "🔍 KV Cache Visualizer - 完整性检查"
echo "======================================"
echo ""

# 1. 检查文件是否存在
echo "1️⃣ 检查文件结构..."
files=(
  "kv-cache-visualizer/index.html"
  "kv-cache-visualizer/js/app.js"
  "kv-cache-visualizer/css/page.css"
  "common/js/i18n.js"
  "common/js/matrix.js"
  "common/css/tokens.css"
  "common/css/matrix.css"
)

all_exist=true
for file in "${files[@]}"; do
  if [ -f "/Users/zhe.liu/Desktop/AI-learning/$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file (缺失)"
    all_exist=false
  fi
done

if [ "$all_exist" = true ]; then
  echo "✅ 所有文件完整"
else
  echo "❌ 部分文件缺失"
  exit 1
fi

echo ""

# 2. 检查 JavaScript 语法
echo "2️⃣ 检查 JavaScript 语法..."
if node --check /Users/zhe.liu/Desktop/AI-learning/kv-cache-visualizer/js/app.js 2>/dev/null; then
  echo "✅ JavaScript 语法正确"
else
  echo "❌ JavaScript 语法错误"
  node --check /Users/zhe.liu/Desktop/AI-learning/kv-cache-visualizer/js/app.js
  exit 1
fi

echo ""

# 3. 检查服务器
echo "3️⃣ 检查 HTTP 服务器..."
if curl -s -f http://localhost:8080/ > /dev/null 2>&1; then
  echo "✅ 服务器运行正常"
else
  echo "❌ 服务器未运行"
  echo "   请运行: cd /Users/zhe.liu/Desktop/AI-learning && python3 -m http.server 8080"
  exit 1
fi

echo ""

# 4. 检查页面可访问性
echo "4️⃣ 检查页面可访问性..."
status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/kv-cache-visualizer/)
if [ "$status" -eq 200 ]; then
  echo "✅ 页面可访问 (HTTP $status)"
else
  echo "❌ 页面访问失败 (HTTP $status)"
  exit 1
fi

echo ""

# 5. 检查资源加载
echo "5️⃣ 检查资源文件..."
resources=(
  "kv-cache-visualizer/js/app.js"
  "common/js/i18n.js"
  "common/js/matrix.js"
  "common/css/tokens.css"
  "common/css/matrix.css"
)

for resource in "${resources[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/$resource")
  if [ "$status" -eq 200 ]; then
    echo "✅ $resource (HTTP $status)"
  else
    echo "❌ $resource (HTTP $status)"
  fi
done

echo ""
echo "======================================"
echo "✅ 所有检查通过！"
echo ""
echo "🌐 访问地址:"
echo "   http://localhost:8080/kv-cache-visualizer/"
echo ""
echo "💡 使用说明:"
echo "   1. 在浏览器中打开上述地址"
echo "   2. 打开开发者工具 (F12)"
echo "   3. 查看 Console 标签，应该看到:"
echo "      ✅ KV Cache Visualizer initialized"
echo "   4. 每个 Stage 应该显示可视化内容"
echo ""
