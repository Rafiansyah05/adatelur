set -e

echo "🚀 Memulai Otomatisasi Deployment Adatelur..."

cd "$(dirname "$0")"

echo "📥 Menarik kode terbaru dari GitHub..."
git pull origin main || git pull origin master

echo "🛠️ Membangun dan memperbarui Docker Containers..."
docker compose up --build -d

echo "🧹 Membersihkan Docker cache lama..."
docker image prune -f

echo "✅ Deployment Berhasil! Aplikasi aktif di port 3020."
