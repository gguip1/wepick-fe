/**
 * Topics API Module
 * WePick 토픽 관련 API 요청을 처리합니다.
 */

import { apiRequest } from './base.js';

export const TopicsAPI = {
  /**
   * 오늘의 토픽을 가져옵니다.
   * @returns {Promise<{data: Object|null, error: Object|null, status: number}>}
   */
  async getTodayTopic() {
    // TODO: API 연동 - 실제 API 엔드포인트로 교체 필요
    // return apiRequest('/topics/today');

    // Mock 데이터 반환
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            id: 1,
            question: '아침형 인간 vs 저녁형 인간, 당신의 선택은?',
            optionA: {
              id: 1,
              text: '아침형 인간',
              description: '일찍 일어나는 새가 벌레를 잡는다'
            },
            optionB: {
              id: 2,
              text: '저녁형 인간',
              description: '밤은 창의성의 시간'
            },
            createdAt: new Date().toISOString(),
            totalVotes: 1234,
            votesA: 567,
            votesB: 667,
          },
          error: null,
          status: 200
        });
      }, 500);
    });
  },

  /**
   * 사용자의 투표 여부를 확인합니다.
   * @param {number} topicId - 토픽 ID
   * @returns {Promise<{data: Object|null, error: Object|null, status: number}>}
   */
  async checkUserVote(topicId) {
    // TODO: API 연동 - 실제 API 엔드포인트로 교체 필요
    // return apiRequest(`/topics/${topicId}/vote/check`);

    // Mock 데이터 반환 (투표하지 않은 상태)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            hasVoted: false,
            choice: null, // 'A' 또는 'B'
          },
          error: null,
          status: 200
        });
      }, 300);
    });
  },

  /**
   * 투표를 제출합니다.
   * @param {number} topicId - 토픽 ID
   * @param {string} choice - 선택 ('A' 또는 'B')
   * @returns {Promise<{data: Object|null, error: Object|null, status: number}>}
   */
  async submitVote(topicId, choice) {
    // TODO: API 연동 - 실제 API 엔드포인트로 교체 필요
    // return apiRequest(`/topics/${topicId}/vote`, {
    //   method: 'POST',
    //   body: JSON.stringify({ choice })
    // });

    // Mock 데이터 반환
    return new Promise((resolve) => {
      setTimeout(() => {
        const votesA = choice === 'A' ? 568 : 567;
        const votesB = choice === 'B' ? 668 : 667;
        const total = votesA + votesB;

        resolve({
          data: {
            success: true,
            results: {
              totalVotes: total,
              votesA: votesA,
              votesB: votesB,
              percentageA: Math.round((votesA / total) * 100),
              percentageB: Math.round((votesB / total) * 100),
              userChoice: choice
            }
          },
          error: null,
          status: 200
        });
      }, 800);
    });
  },

  /**
   * 토픽 상세 정보를 가져옵니다.
   * @param {number} topicId - 토픽 ID
   * @returns {Promise<{data: Object|null, error: Object|null, status: number}>}
   */
  async getTopicDetail(topicId) {
    // TODO: API 연동 - 실제 API 엔드포인트로 교체 필요
    // return apiRequest(`/topics/${topicId}`);

    // Mock 데이터 반환
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            id: topicId,
            question: '아침형 인간 vs 저녁형 인간, 당신의 선택은?',
            optionA: {
              id: 1,
              text: '🌅 아침형 인간',
              description: '일찍 일어나는 새가 벌레를 잡는다'
            },
            optionB: {
              id: 2,
              text: '🌙 저녁형 인간',
              description: '밤은 창의성의 시간'
            },
            createdAt: new Date().toISOString(),
            totalVotes: 1234,
            votesA: 567,
            votesB: 667,
            percentageA: 46,
            percentageB: 54,
            userChoice: null, // 'A' 또는 'B' 또는 null
            communityThreadId: null, // 연동된 커뮤니티 글 ID
          },
          error: null,
          status: 200
        });
      }, 500);
    });
  },

  /**
   * 이전 토픽 목록을 가져옵니다.
   * @param {Object} options - 옵션 (page, size 등)
   * @returns {Promise<{data: Object|null, error: Object|null, status: number}>}
   */
  async getTopicHistory(options = {}) {
    // TODO: API 연동 - 실제 API 엔드포인트로 교체 필요
    // const { page = 1, size = 10 } = options;
    // return apiRequest(`/topics?page=${page}&size=${size}`);

    // Mock 데이터 반환
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockTopics = [
          {
            id: 1,
            question: '아침형 인간 vs 저녁형 인간, 당신의 선택은?',
            optionA: { text: '🌅 아침형 인간' },
            optionB: { text: '🌙 저녁형 인간' },
            totalVotes: 1234,
            percentageA: 46,
            percentageB: 54,
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            question: '커피 vs 차, 당신의 선택은?',
            optionA: { text: '☕ 커피' },
            optionB: { text: '🍵 차' },
            totalVotes: 2345,
            percentageA: 62,
            percentageB: 38,
            createdAt: new Date(Date.now() - 86400000).toISOString() // 1일 전
          }
        ];

        resolve({
          data: {
            topics: mockTopics,
            total: 2,
            page: 1,
            size: 10
          },
          error: null,
          status: 200
        });
      }, 500);
    });
  }
};
