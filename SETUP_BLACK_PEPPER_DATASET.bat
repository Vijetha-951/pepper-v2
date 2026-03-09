@echo off
REM Black Pepper Dataset Setup Script
echo =====================================
echo Black Pepper Dataset Setup
echo =====================================
echo.

cd /d "%~dp0backend\python"

echo Creating Black Pepper dataset directory structure...
echo.

REM Create main directory
mkdir black_pepper_dataset 2>nul

REM Create train directories
mkdir black_pepper_dataset\train\healthy 2>nul
mkdir black_pepper_dataset\train\bacterial_wilt 2>nul
mkdir black_pepper_dataset\train\foot_rot 2>nul
mkdir black_pepper_dataset\train\anthracnose 2>nul
mkdir black_pepper_dataset\train\yellow_leaf 2>nul

REM Create validation directories
mkdir black_pepper_dataset\validation\healthy 2>nul
mkdir black_pepper_dataset\validation\bacterial_wilt 2>nul
mkdir black_pepper_dataset\validation\foot_rot 2>nul
mkdir black_pepper_dataset\validation\anthracnose 2>nul
mkdir black_pepper_dataset\validation\yellow_leaf 2>nul

REM Create test directories
mkdir black_pepper_dataset\test\healthy 2>nul
mkdir black_pepper_dataset\test\bacterial_wilt 2>nul
mkdir black_pepper_dataset\test\foot_rot 2>nul
mkdir black_pepper_dataset\test\anthracnose 2>nul
mkdir black_pepper_dataset\test\yellow_leaf 2>nul

echo.
echo ✅ Dataset directory structure created!
echo.
echo 📁 Location: %cd%\black_pepper_dataset
echo.
echo 📝 Next steps:
echo 1. Add images to each disease folder (minimum 100+ images per class)
echo 2. Run: python train_black_pepper_cnn.py
echo.
echo Disease classes created:
echo   - healthy
echo   - bacterial_wilt
echo   - foot_rot
echo   - anthracnose
echo   - yellow_leaf
echo.
echo Opening dataset folder...
explorer black_pepper_dataset
echo.
echo Press any key to exit...
pause >nul
