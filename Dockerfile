# syntax=docker/dockerfile:1

# Build the React/TypeScript assets with the Node version used in CI.
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run typecheck && npm run build && test -f public/build/manifest.json

# Build the PHP application with the exact PHP extensions required at runtime.
FROM php:8.5-apache AS app
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public \
    COMPOSER_ALLOW_SUPERUSER=1
RUN apt-get update && apt-get install -y --no-install-recommends \
      gettext-base \
      git \
      libcurl4-openssl-dev \
      libonig-dev \
      libpq-dev \
      libxml2-dev \
      unzip \
    && docker-php-ext-install -j"$(nproc)" bcmath curl mbstring pdo_pgsql xml \
    && a2enmod rewrite headers \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
WORKDIR /var/www/html

# Copy manifests first to keep dependency installation cacheable.
COPY composer.json composer.lock ./
RUN composer validate --strict \
    && composer install --no-dev --prefer-dist --no-interaction --no-progress \
       --optimize-autoloader --no-scripts

COPY . .
COPY --from=frontend-build /app/public/build ./public/build
COPY docker/apache-vhost.conf.template /etc/apache2/sites-available/000-default.conf.template
COPY docker/ports.conf.template /etc/apache2/ports.conf.template
COPY docker/start.sh /usr/local/bin/crescent-start
RUN chmod +x /usr/local/bin/crescent-start \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && composer check-platform-reqs --no-dev \
    && php artisan package:discover --ansi \
    && test -f public/build/manifest.json

EXPOSE 10000
CMD ["/usr/local/bin/crescent-start"]
