/**
 * Topics API Module
 * WePick 토픽 관련 API 요청을 처리합니다.
 *
 * API 명세:
 * - Time Zone: Asia/Seoul (KST)
 * - 날짜 포맷: YYYY-MM-DD
 * - 투표 규칙: 하루에 하나의 토픽만 활성화, 당일에만 투표 가능
 */

import { apiRequest } from './base.js';

export const TopicsAPI = {
  /**
   * 오늘의 토픽을 가져옵니다.
   * 로그인한 유저는 본인의 투표 여부(votedOptionId)를 확인할 수 있습니다.
   *
   * @returns {Promise<{data: Object|null, error: Object|null, status: number}>}
   *
   * Response 형식:
   * {
   *   topicId: number,
   *   title: string,
   *   description: string,
   *   targetDate: "YYYY-MM-DD",
   *   status: "OPEN" | "CLOSED",
   *   options: [
   *     { optionId, label: "A", text, description, voteCount, percent },
   *     { optionId, label: "B", text, description, voteCount, percent }
   *   ],
   *   totalVotes: number,
   *   votedOptionId: number | null  // 투표하지 않았거나 비로그인 시 null
   * }
   */
  async getTodayTopic() {
    // 404는 "오늘 토픽 없음"이므로 404 페이지로 리다이렉트하지 않음
    return apiRequest('/topics/today', { skip404Redirect: true });
  },

  /**
   * 특정 토픽의 옵션에 투표합니다.
   * 해당 토픽의 targetDate가 오늘일 때만 투표 가능합니다.
   *
   * @param {number} topicId - 토픽 ID
   * @param {number} optionId - 선택한 옵션 ID
   * @returns {Promise<{data: Object|null, error: Object|null, status: number}>}
   *
   * 에러:
   * - 409 Conflict: 이미 투표한 경우 (DUPLICATE_VOTE)
   * - 404 Not Found: 오늘 날짜의 토픽이 아닌 경우 (투표 기간 만료)
   */
  async submitVote(topicId, optionId) {
    return apiRequest(`/topics/${topicId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId })
    });
  },

  /**
   * 과거 토픽 목록을 조회합니다 (아카이브).
   * 기본적으로 날짜 내림차순(targetDate,DESC)으로 정렬됩니다.
   *
   * @param {Object} options - 페이징 옵션
   * @param {number} options.page - 페이지 번호 (0부터 시작, 기본 0)
   * @param {number} options.size - 페이지 당 개수 (기본 10)
   * @returns {Promise<{data: Object|null, error: Object|null, status: number}>}
   *
   * Response 형식:
   * {
   *   content: [{ topicId, title, targetDate, status }, ...],
   *   pageable: {...},
   *   totalElements: number,
   *   totalPages: number,
   *   last: boolean
   * }
   */
  async getTopicArchive(options = {}) {
    const { page = 0, size = 10 } = options;
    return apiRequest(`/topics?page=${page}&size=${size}`);
  },

  /**
   * 새로운 토픽을 생성합니다. (관리자용)
   * 같은 날짜(targetDate)에 이미 토픽이 있으면 생성할 수 없습니다.
   *
   * @param {Object} topicData - 토픽 데이터
   * @param {string} topicData.title - 토픽 제목
   * @param {string} topicData.description - 토픽 설명
   * @param {string} topicData.targetDate - 활성화 날짜 (YYYY-MM-DD)
   * @param {string} topicData.status - 상태 ("OPEN")
   * @param {string} topicData.optionAText - 옵션 A 텍스트
   * @param {string} topicData.optionADescription - 옵션 A 설명
   * @param {string} topicData.optionBText - 옵션 B 텍스트
   * @param {string} topicData.optionBDescription - 옵션 B 설명
   * @returns {Promise<{data: number|null, error: Object|null, status: number}>}
   *
   * 에러:
   * - 409 Conflict: 해당 날짜에 이미 토픽이 있는 경우 (DUPLICATE_TOPIC_DATE)
   */
  async createTopic(topicData) {
    return apiRequest('/topics', {
      method: 'POST',
      body: JSON.stringify(topicData)
    });
  },

  /**
   * 기존 토픽을 수정합니다. (관리자용)
   * 날짜(targetDate) 변경 시, 변경하려는 날짜에 이미 토픽이 있다면 실패합니다.
   *
   * @param {number} topicId - 토픽 ID
   * @param {Object} updateData - 수정할 데이터 (수정이 필요한 필드만)
   * @returns {Promise<{data: null, error: Object|null, status: number}>}
   */
  async updateTopic(topicId, updateData) {
    return apiRequest(`/topics/${topicId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
  }
};
