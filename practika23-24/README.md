Практика 19: PostgreSQL
- Создана база данных user_api_db в PostgreSQL
- Реализован Express-сервер с CRUD-операциями
- Использован Sequelize ORM
- Поля: id, first_name, last_name, age, created_at, updated_at

Практика 20: MongoDB
- Установлен MongoDB в WSL
- Создан администратор YourMongoAdmin
- Реализован Express-сервер с Mongoose ODM
- CRUD-операции для пользователей

Практика 21: Redis (кэширование)
- Установлен Redis через Docker
- Реализован cacheMiddleware для Express
- Кэшируются: GET /api/users и GET /api/users/:id
- TTL: 60 секунд
- При POST/PATCH/DELETE кэш инвалидируется

Практика 22: Балансировка нагрузки (Nginx + HAProxy)
- 3 backend-сервера на Node.js (порты 3001, 3002, 3003)
- Nginx как балансировщик (Round Robin)
- Отказоустойчивость: max_fails=2, fail_timeout=30s
- Резервный сервер (backup)
- Альтернативная конфигурация HAProxy

Практика 23: Docker + Docker Compose
- Написан Dockerfile для backend-сервиса
- Написан docker-compose.yml с 3 backend-сервисами и Nginx
- Все сервисы запускаются одной командой

Практика 24: Подготовка к контрольной работе
- Протестированы все практики 19-23
- Подготовлен README.md с описанием
- Репозиторий открытый