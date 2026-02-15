git pull
php artisan migrate
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear
npm run build
pm2 restart telegram-shop-api --update-env