const BASE_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('rk_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  const contentType = res.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = data?.error || (typeof data === 'string' ? data : 'An unexpected error occurred');
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  // Auth
  async register(username, password, confirmPassword) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, confirmPassword })
    });
    return handleResponse(res);
  },

  async login(username, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateSettings(formData) {
    const res = await fetch(`${BASE_URL}/auth/settings`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return handleResponse(res);
  },

  // Videos
  async getVideos(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/videos?${query}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getVideo(id) {
    const res = await fetch(`${BASE_URL}/videos/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  uploadVideo(formData, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}/videos/upload`);

      const token = localStorage.getItem('rk_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            const percent = Math.min(98, Math.max(1, Math.round((event.loaded / event.total) * 100)));
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        let data = null;
        try {
          data = JSON.parse(xhr.responseText);
        } catch (e) {
          data = xhr.responseText;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          if (onProgress) onProgress(100);
          resolve(data);
        } else {
          const msg = data?.error || (typeof data === 'string' ? data : 'Upload failed');
          reject(new Error(msg));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during video upload. Please check your internet connection.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Video upload timed out. Match footage may be too large.'));
      };

      xhr.send(formData);
    });
  },

  async toggleLike(id) {
    const res = await fetch(`${BASE_URL}/videos/${id}/like`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async deleteVideo(id) {
    const res = await fetch(`${BASE_URL}/videos/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Comments
  async getComments(videoId) {
    const res = await fetch(`${BASE_URL}/comments/video/${videoId}`);
    return handleResponse(res);
  },

  async postComment(videoId, content) {
    const res = await fetch(`${BASE_URL}/comments/video/${videoId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ content })
    });
    return handleResponse(res);
  },

  async deleteComment(id) {
    const res = await fetch(`${BASE_URL}/comments/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Users & Channels
  async getChannel(username) {
    const res = await fetch(`${BASE_URL}/users/${username}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async toggleSubscribe(username) {
    const res = await fetch(`${BASE_URL}/users/${username}/subscribe`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Clan & Leaderboard
  async getClanInfo() {
    const res = await fetch(`${BASE_URL}/clan/info`);
    return handleResponse(res);
  },

  async getRoster() {
    const res = await fetch(`${BASE_URL}/clan/roster`);
    return handleResponse(res);
  },

  async getLeaderboard(sort = 'rating') {
    const res = await fetch(`${BASE_URL}/clan/leaderboard?sort=${sort}`);
    return handleResponse(res);
  },

  // Reports
  async submitReport(targetType, targetId, reason, details = '') {
    const res = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ targetType, targetId, reason, details })
    });
    return handleResponse(res);
  },

  // Admin
  async getAdminStats() {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getAdminUsers() {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async toggleUserBan(userId) {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}/ban`, {
      method: 'PUT',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async toggleFeatureVideo(videoId) {
    const res = await fetch(`${BASE_URL}/admin/videos/${videoId}/feature`, {
      method: 'PUT',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getAdminReports() {
    const res = await fetch(`${BASE_URL}/admin/reports`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateReportStatus(reportId, status) {
    const res = await fetch(`${BASE_URL}/admin/reports/${reportId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  async adminDeleteVideo(videoId) {
    const res = await fetch(`${BASE_URL}/admin/videos/${videoId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminDeleteComment(commentId) {
    const res = await fetch(`${BASE_URL}/admin/comments/${commentId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async addLeaderboardMember(memberData) {
    const res = await fetch(`${BASE_URL}/admin/leaderboard/member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(memberData)
    });
    return handleResponse(res);
  },

  async removeLeaderboardMember(memberId) {
    const res = await fetch(`${BASE_URL}/admin/leaderboard/member/${memberId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  }
};
