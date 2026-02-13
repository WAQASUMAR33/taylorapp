@echo off
echo Stopping dev server...
echo Please press Ctrl+C in the terminal running npm run dev
echo.
pause
echo.
echo Regenerating Prisma Client...
npx prisma generate
echo.
echo Done! Now restart your dev server with: npm run dev
pause
