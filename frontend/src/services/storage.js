// LocalStorage service to manage user session, cached attendance data, and UI preferences

const KEYS = {
  SESSION: "attend_smart_session",
  ROLE: "attend_smart_last_role",
  STUDENT_CACHE: "attend_smart_student_cache",
  TEACHER_CACHE: "attend_smart_teacher_cache",
  THEME: "attend_smart_theme"
};

export const storage = {
  // Session
  getSession() {
    try {
      const data = localStorage.getItem(KEYS.SESSION);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Failed to parse session from localStorage:", e);
      return null;
    }
  },

  setSession(sessionData) {
    try {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(sessionData));
      if (sessionData?.user?.role) {
        localStorage.setItem(KEYS.ROLE, sessionData.user.role);
      }
    } catch (e) {
      console.error("Failed to save session to localStorage:", e);
    }
  },

  clearSession() {
    try {
      localStorage.removeItem(KEYS.SESSION);
      localStorage.removeItem(KEYS.STUDENT_CACHE);
      localStorage.removeItem(KEYS.TEACHER_CACHE);
    } catch (e) {
      console.error("Failed to clear session:", e);
    }
  },

  // Role preference
  getLastRole() {
    return localStorage.getItem(KEYS.ROLE) || "student";
  },

  setLastRole(role) {
    localStorage.setItem(KEYS.ROLE, role);
  },

  // Student Attendance Cache
  getCachedStudentData() {
    try {
      const data = localStorage.getItem(KEYS.STUDENT_CACHE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setCachedStudentData(dashboardData) {
    try {
      localStorage.setItem(KEYS.STUDENT_CACHE, JSON.stringify({
        data: dashboardData,
        cachedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.error("Failed to cache student data:", e);
    }
  },

  // Teacher Attendance Cache
  getCachedTeacherData() {
    try {
      const data = localStorage.getItem(KEYS.TEACHER_CACHE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setCachedTeacherData(teacherData) {
    try {
      localStorage.setItem(KEYS.TEACHER_CACHE, JSON.stringify({
        data: teacherData,
        cachedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.error("Failed to cache teacher data:", e);
    }
  }
};
