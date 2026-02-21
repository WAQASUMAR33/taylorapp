@echo off
echo ========================================
echo  Updating Database Schema
echo ========================================
echo.
echo Step 1: Pushing schema changes to database...
npx prisma db push --skip-generate
echo.
echo Step 2: Regenerating Prisma Client...
npx prisma generate
echo.
echo ========================================
echo  Done! Now restart your dev server with:
echo  npm run dev
echo ========================================
pause
