#!/bin/bash

echo "🚀 Memulai Otomatisasi Deployment Adatelur..."

# 1. Pastikan berada di direktori project (tempat deploy.sh berada)
cd "$(dirname "$0")"

# 2. Pull update kode terbaru dari GitHub
echo "📥 Menarik kode terbaru dari GitHub..."
git pull origin main || git pull origin master

# 3. Build ulang & jalankan container dengan Docker Compose
echo "🛠️ Membangun dan memperbarui Docker Containers..."
docker compose up --build -d

# 4. Bersihkan image lama/dangling agar storage server tidak penuh
echo "🧹 Membersihkan Docker cache lama..."
docker image prune -f

echo "✅ Deployment Berhasil! Aplikasi aktif di port 3020."
