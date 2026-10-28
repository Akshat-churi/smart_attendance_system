import { storage } from "./storage";

const API_BASE = "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const session = storage.getSession();
  const token = session?.token;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.status === 401) {
      // Session expired or invalid
      storage.clearSession();
      // Optional: trigger auth event or reload
    }
    throw error;
  }
}

export const api = {
  auth: {
    login: (username, password, role) =>
      request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password, role })
      }),
    me: () => request("/auth/me"),
    getDemoAccounts: () => request("/auth/demo-accounts")
  },

  student: {
    getDashboard: async () => {
      const result = await request("/student/dashboard");
      if (result.success) {
        storage.setCachedStudentData(result);
      }
      return result;
    }
  },

  teacher: {
    getDashboard: async () => {
      const result = await request("/teacher/dashboard");
      if (result.success) {
        storage.setCachedTeacherData(result);
      }
      return result;
    },
    getAttendanceRecords: (params = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append("search", params.search);
      if (params.subject_id) query.append("subject_id", params.subject_id);
      if (params.date) query.append("date", params.date);
      if (params.status) query.append("status", params.status);
      if (params.limit) query.append("limit", params.limit);
      return request(`/teacher/attendance-records?${query.toString()}`);
    },
    getSubjectSummary: (subjectId) =>
      request(`/teacher/subject-summary/${subjectId}`),
    markManualAttendance: (payload) =>
      request("/teacher/mark-manual-attendance", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    getStudentDetail: (studentId) =>
      request(`/teacher/student-detail/${studentId}`),
    deleteAttendance: (attendanceId) =>
      request(`/teacher/delete-attendance/${attendanceId}`, {
        method: "DELETE"
      })
  },

  face: {
    register: (imageBase64) =>
      request("/face/register", {
        method: "POST",
        body: JSON.stringify({ image: imageBase64 })
      }),
    markAttendance: (payload) =>
      request("/face/mark-attendance", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    teacherScan: (payload) =>
      request("/face/teacher-scan", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    getCourseRosterStatus: (subjectId) =>
      request(`/face/course-roster-status/${subjectId}`),
    getStatus: () => request("/face/status")
  }
};
