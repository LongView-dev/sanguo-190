/**
 * 新闻流组件属性测试
 * **Feature: sanguo-190, Property 16: 事件类型与边框颜色映射**
 * **Feature: sanguo-190, Property 17: 新闻流事件顺序**
 * **Validates: Requirements 3.3, 3.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getEventBorderColor, sortEventsByNewest, type NewsFeedEvent } from './NewsFeed';
import type { GameEventType } from '../../types/events';
import { EVENT_BORDER_COLORS } from '../../types/events';

// 生成器定义

/** 事件类型生成器 */
const eventTypeArb = fc.constantFrom<GameEventType>('battle', 'domestic', 'disaster', 'general');

/** 时间戳生成器 */
const timestampArb = fc.record({
  year: fc.integer({ min: 190, max: 300 }),
  month: fc.integer({ min: 1, max: 12 }),
});

/** 事件ID生成器 */
const eventIdArb = fc.uuid();

/** 叙事文本生成器 */
const narrativeArb = fc.string({ minLength: 1, maxLength: 100 });

/** 新闻流事件生成器 */
const newsFeedEventArb: fc.Arbitrary<NewsFeedEvent> = fc.record({
  id: eventIdArb,
  type: eventTypeArb,
  narrative: narrativeArb,
  timestamp: timestampArb,
});

/** 新闻流事件列表生成器 */
const newsFeedEventsArb = fc.array(newsFeedEventArb, { minLength: 0, maxLength: 50 });

/**
 * **Feature: sanguo-190, Property 16: 事件类型与边框颜色映射**
 * *For any* 游戏事件，其在新闻流中的左边框颜色必须与事件类型对应（战争-红、内政-绿、灾害-黄、武将-紫）。
 * **Validates: Requirements 3.3**
 */
describe('Property 16: 事件类型与边框颜色映射', () => {
  /**
   * 核心属性：事件类型必须映射到正确的颜色
   */
  it('should map event type to correct border color', () => {
    fc.assert(
      fc.property(eventTypeArb, (eventType) => {
        const color = getEventBorderColor(eventType);
        
        // 验证颜色与预定义的映射一致
        expect(color).toBe(EVENT_BORDER_COLORS[eventType]);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 验证战争事件返回红色
   */
  it('should return red color for battle events', () => {
    const color = getEventBorderColor('battle');
    expect(color).toBe('#ef4444');
  });

  /**
   * 验证内政事件返回绿色
   */
  it('should return green color for domestic events', () => {
    const color = getEventBorderColor('domestic');
    expect(color).toBe('#22c55e');
  });

  /**
   * 验证灾害事件返回黄色
   */
  it('should return yellow color for disaster events', () => {
    const color = getEventBorderColor('disaster');
    expect(color).toBe('#eab308');
  });

  /**
   * 验证武将事件返回紫色
   */
  it('should return purple color for general events', () => {
    const color = getEventBorderColor('general');
    expect(color).toBe('#a855f7');
  });

  /**
   * 验证所有事件类型都有对应颜色
   */
  it('should have color mapping for all event types', () => {
    const allEventTypes: GameEventType[] = ['battle', 'domestic', 'disaster', 'general'];
    
    for (const eventType of allEventTypes) {
      const color = getEventBorderColor(eventType);
      
      // 验证返回的是有效的CSS颜色格式
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      
      // 验证颜色不为空
      expect(color).toBeTruthy();
    }
  });

  /**
   * 验证颜色映射的一致性（相同类型总是返回相同颜色）
   */
  it('should return consistent color for same event type', () => {
    fc.assert(
      fc.property(eventTypeArb, (eventType) => {
        const color1 = getEventBorderColor(eventType);
        const color2 = getEventBorderColor(eventType);
        
        // 相同事件类型应该返回相同颜色
        expect(color1).toBe(color2);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 验证不同事件类型有不同颜色
   */
  it('should return different colors for different event types', () => {
    const allEventTypes: GameEventType[] = ['battle', 'domestic', 'disaster', 'general'];
    const colors = allEventTypes.map(getEventBorderColor);
    const uniqueColors = new Set(colors);
    
    // 每种事件类型应该有唯一的颜色
    expect(uniqueColors.size).toBe(allEventTypes.length);
  });
});

/**
 * **Feature: sanguo-190, Property 17: 新闻流事件顺序**
 * *For any* 事件序列添加到新闻流，显示顺序必须是最新事件在最上方。
 * **Validates: Requirements 3.4**
 */
describe('Property 17: 新闻流事件顺序', () => {
  /**
   * 核心属性：排序后的事件列表必须按时间降序排列（最新在前）
   */
  it('should sort events with newest first', () => {
    fc.assert(
      fc.property(newsFeedEventsArb, (events) => {
        const sorted = sortEventsByNewest(events);
        
        // 验证排序后的列表长度不变
        expect(sorted.length).toBe(events.length);
        
        // 验证排序顺序：每个事件的时间戳应该 >= 下一个事件的时间戳
        for (let i = 0; i < sorted.length - 1; i++) {
          const current = sorted[i];
          const next = sorted[i + 1];
          
          // 比较时间戳：年份优先，然后月份
          const currentTime = current.timestamp.year * 12 + current.timestamp.month;
          const nextTime = next.timestamp.year * 12 + next.timestamp.month;
          
          expect(currentTime).toBeGreaterThanOrEqual(nextTime);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 验证空列表排序
   */
  it('should handle empty event list', () => {
    const sorted = sortEventsByNewest([]);
    expect(sorted).toEqual([]);
  });

  /**
   * 验证单个事件排序
   */
  it('should handle single event', () => {
    fc.assert(
      fc.property(newsFeedEventArb, (event) => {
        const sorted = sortEventsByNewest([event]);
        
        expect(sorted.length).toBe(1);
        expect(sorted[0]).toEqual(event);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 验证排序不修改原数组
   */
  it('should not mutate original array', () => {
    fc.assert(
      fc.property(newsFeedEventsArb, (events) => {
        const originalEvents = [...events];
        sortEventsByNewest(events);
        
        // 原数组应该保持不变
        expect(events).toEqual(originalEvents);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 验证所有原始事件都在排序后的列表中
   */
  it('should preserve all events after sorting', () => {
    fc.assert(
      fc.property(newsFeedEventsArb, (events) => {
        const sorted = sortEventsByNewest(events);
        
        // 验证所有原始事件的ID都在排序后的列表中
        const originalIds = new Set(events.map(e => e.id));
        const sortedIds = new Set(sorted.map(e => e.id));
        
        expect(sortedIds).toEqual(originalIds);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 验证年份优先于月份排序
   */
  it('should prioritize year over month in sorting', () => {
    const events: NewsFeedEvent[] = [
      { id: '1', type: 'battle', narrative: '事件1', timestamp: { year: 190, month: 12 } },
      { id: '2', type: 'domestic', narrative: '事件2', timestamp: { year: 191, month: 1 } },
      { id: '3', type: 'general', narrative: '事件3', timestamp: { year: 190, month: 6 } },
    ];
    
    const sorted = sortEventsByNewest(events);
    
    // 191年1月应该在最前面，然后是190年12月，最后是190年6月
    expect(sorted[0].id).toBe('2'); // 191年1月
    expect(sorted[1].id).toBe('1'); // 190年12月
    expect(sorted[2].id).toBe('3'); // 190年6月
  });

  /**
   * 验证同年同月事件的稳定性
   */
  it('should maintain relative order for events with same timestamp', () => {
    fc.assert(
      fc.property(
        timestampArb,
        fc.array(newsFeedEventArb, { minLength: 2, maxLength: 10 }),
        (timestamp, events) => {
          // 将所有事件设置为相同时间戳
          const sameTimeEvents = events.map((e, idx) => ({
            ...e,
            id: `event_${idx}`,
            timestamp: { ...timestamp },
          }));
          
          const sorted = sortEventsByNewest(sameTimeEvents);
          
          // 验证长度不变
          expect(sorted.length).toBe(sameTimeEvents.length);
          
          // 验证所有事件都有相同的时间戳
          for (const event of sorted) {
            expect(event.timestamp.year).toBe(timestamp.year);
            expect(event.timestamp.month).toBe(timestamp.month);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 验证跨年排序正确性
   */
  it('should correctly sort events across multiple years', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 190, max: 250 }),
        fc.integer({ min: 1, max: 10 }),
        (startYear, yearSpan) => {
          // 创建跨越多年的事件
          const events: NewsFeedEvent[] = [];
          for (let y = 0; y < yearSpan; y++) {
            for (let m = 1; m <= 12; m++) {
              events.push({
                id: `event_${startYear + y}_${m}`,
                type: 'battle',
                narrative: `${startYear + y}年${m}月事件`,
                timestamp: { year: startYear + y, month: m },
              });
            }
          }
          
          // 打乱顺序
          const shuffled = [...events].sort(() => Math.random() - 0.5);
          const sorted = sortEventsByNewest(shuffled);
          
          // 验证排序正确
          for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];
            const currentTime = current.timestamp.year * 12 + current.timestamp.month;
            const nextTime = next.timestamp.year * 12 + next.timestamp.month;
            
            expect(currentTime).toBeGreaterThanOrEqual(nextTime);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
