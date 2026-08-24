# Social Dashboard — запуск локально (без Docker)

## Учётные данные админа
- Логин: `admin`
- Пароль: `KN7Ma7yuVy_VWzBq-Zdr1w`
(хранятся в `.env`, можно сменить там же)

## Быстрый запуск (если всё уже установлено)
1. **Backend** — запустить `start_backend.bat` (сервер на :8000)
2. **Frontend** — запустить `start_frontend.bat` (Vite на :3000)
3. Открыть http://localhost:3000 → `/admin` → логин

## Установка с нуля
1. `setup.bat` — пересоздаёт venv, ставит Python-зависимости бэкенда
2. `start_backend.bat` — запуск бэкенда
3. `start_frontend.bat` — запуск фронтенда (Node portable уже в `tools\node`)

## Что было исправлено
- `frontend/tsconfig.app.json`: добавлен `resolveJsonModule` (починка сборки Vite)
- `backend/config.py`: загрузка `.env` через python-dotenv
- `frontend/src/context/FilterContext.tsx`: `triggerRefresh` через `useCallback`
- `frontend/src/components/DataTable.tsx`: экранирование CSV, `hover:bg-white/[0.03]`
- `frontend/src/pages/AdminUploads.tsx`: сообщения об ошибках красные, успех — зелёный
- `frontend/src/pages/DashboardOverview.tsx`: проверка «нет данных» для всех 4 секций
- `frontend/src/api.ts`: нет хвоста `?` в URL без фильтров
- `frontend/vite.config.ts`: dev-порт :3000
- Создана папка `backend/data/` (для SQLite)

## Эндпоинты
- Backend: http://localhost:8000/health, `/docs` (DEBUG=true)
- Frontend: http://localhost:3000 (прокси `/api` → :8000)