"use client"

import type React from "react"

import { createContext, useContext } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"

type Language = "en" | "ru"

type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    "home.title": "AI Video Highlights Generator",
    "home.subtitle": "Upload your videos and get AI-generated highlights",
    "home.getStarted": "Get Started",
    "home.howItWorks": "How It Works",
    "header.home": "Home",
    "header.dashboard": "Dashboard",
    "header.settings": "Settings",
    "header.login": "Log In",
    "header.signup": "Sign Up",
    "header.logout": "Log Out",
    "wizard.step1": "Choose Video",
    "wizard.step2": "Select AI Model",
    "wizard.step3": "Format Settings",
    "wizard.step4": "Customization",
    "wizard.step5": "Results",
    "wizard.next": "Next",
    "wizard.back": "Back",
    "wizard.process": "Generate Highlights",
    "wizard.upload": "Upload Video",
    "wizard.youtube": "YouTube Link",
    "wizard.or": "or",
    "wizard.dragDrop": "Drag and drop your video here",
    "wizard.selectFile": "Select video file",
    "model.context": "Context AI",
    "model.motion": "Motion AI",
    "model.contextDesc":
      "Extracts semantic highlights (key moments from talks, interviews based on transcript & keywords)",
    "model.motionDesc": "Detects high-action moments (punches, jumps, dances in sports or performance videos)",
    "format.aspectRatio": "Aspect Ratio",
    "format.portrait": "Portrait (9:16)",
    "format.landscape": "Landscape (16:9)",
    "format.duration": "Highlight Duration",
    "format.short": "15 seconds",
    "format.medium": "1 minute",
    "format.full": "Full set",
    "custom.title": "Optional Customization",
    "custom.keywords": "Focus Keywords (Optional)",
    "custom.keywordsHint": "Add keywords to guide the Context AI",
    "custom.font": "Font Style",
    "custom.transition": "Transition Style",
    "results.preview": "Preview",
    "results.download": "Download Highlights",
    "results.description": "Generated Description",
    "results.hashtags": "Hashtags",
    "results.saveProject": "Save to Projects",
    "results.processing": "Processing Your Video",
    "dashboard.title": "Your Projects",
    "dashboard.noProjects": "No saved projects yet",
    "dashboard.createNew": "Create New Highlight",
    "settings.title": "Settings",
    "settings.account": "Account",
    "settings.preferences": "Preferences",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.defaultModel": "Default AI Model",
    "settings.defaultAspect": "Default Aspect Ratio",
    "settings.defaultDuration": "Default Duration",
    "settings.save": "Save Changes",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.login": "Log In",
    "auth.signup": "Sign Up",
    "auth.forgotPassword": "Forgot Password?",
    "auth.googleLogin": "Continue with Google",
  },
  ru: {
    "home.title": "Генератор видео-хайлайтов на базе ИИ",
    "home.subtitle": "Загрузите ваши видео и получите хайлайты, созданные ИИ",
    "home.getStarted": "Начать",
    "home.howItWorks": "Как это работает",
    "header.home": "Главная",
    "header.dashboard": "Панель управления",
    "header.settings": "Настройки",
    "header.login": "Войти",
    "header.signup": "Регистрация",
    "header.logout": "Выйти",
    "wizard.step1": "Выбор видео",
    "wizard.step2": "Выбор модели ИИ",
    "wizard.step3": "Настройки формата",
    "wizard.step4": "Настройка",
    "wizard.step5": "Результаты",
    "wizard.next": "Далее",
    "wizard.back": "Назад",
    "wizard.process": "Создать хайлайты",
    "wizard.upload": "Загрузить видео",
    "wizard.youtube": "Ссылка YouTube",
    "wizard.or": "или",
    "wizard.dragDrop": "Перетащите ваше видео сюда",
    "wizard.selectFile": "Выбрать видеофайл",
    "model.context": "Контекстный ИИ",
    "model.motion": "ИИ движения",
    "model.contextDesc":
      "Извлекает смысловые моменты (ключевые моменты из бесед и интервью на основе транскрипции и ключевых слов)",
    "model.motionDesc":
      "Обнаруживает моменты с высокой активностью (удары, прыжки, танцы в спортивных или исполнительских видео)",
    "format.aspectRatio": "Соотношение сторон",
    "format.portrait": "Портретное (9:16)",
    "format.landscape": "Альбомное (16:9)",
    "format.duration": "Длительность хайлайтов",
    "format.short": "15 секунд",
    "format.medium": "1 минута",
    "format.full": "Полный набор",
    "custom.title": "Дополнительная настройка",
    "custom.keywords": "Ключевые слова (Опционально)",
    "custom.keywordsHint": "Добавьте ключевые слова для работы Контекстного ИИ",
    "custom.font": "Стиль шрифта",
    "custom.transition": "Стиль переходов",
    "results.preview": "Предпросмотр",
    "results.download": "Скачать хайлайты",
    "results.description": "Сгенерированное описание",
    "results.hashtags": "Хэштеги",
    "results.saveProject": "Сохранить в проекты",
    "results.processing": "Обработка вашего видео",
    "dashboard.title": "Ваши проекты",
    "dashboard.noProjects": "Сохраненных проектов пока нет",
    "dashboard.createNew": "Создать новый хайлайт",
    "settings.title": "Настройки",
    "settings.account": "Аккаунт",
    "settings.preferences": "Предпочтения",
    "settings.language": "Язык",
    "settings.theme": "Тема",
    "settings.defaultModel": "Модель ИИ по умолчанию",
    "settings.defaultAspect": "Соотношение сторон по умолчанию",
    "settings.defaultDuration": "Длительность по умолчанию",
    "settings.save": "Сохранить изменения",
    "auth.email": "Эл. почта",
    "auth.password": "Пароль",
    "auth.login": "Войти",
    "auth.signup": "Зарегистрироваться",
    "auth.forgotPassword": "Забыли пароль?",
    "auth.googleLogin": "Продолжить с Google",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useLocalStorage<Language>("language", "en")

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const t = (key: string) => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
