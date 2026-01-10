/**
 * 新闻流组件
 * 显示游戏事件的演义风格文本，支持自动滚动和事件类型颜色边框
 * @module components/NewsFeed/NewsFeed
 */

import { useEffect, useRef } from 'react';
import type { GameEventType, GameTimestamp } from '../../types/events';
import { EVENT_BORDER_COLORS } from '../../types/events';
import './NewsFeed.css';

/**
 * 新闻流事件项
 */
export interface NewsFeedEvent {
  /** 唯一标识符 */
  id: string;
  /** 事件类型 */
  type: GameEventType;
  /** 叙事文本 */
  narrative: string;
  /** 事件时间戳 */
  timestamp: GameTimestamp;
}

/**
 * 新闻流组件属性
 */
export interface NewsFeedProps {
  /** 事件列表 */
  events: NewsFeedEvent[];
  /** 是否自动滚动到最新事件 */
  autoScroll?: boolean;
}

/**
 * 获取事件类型的边框颜色
 * @param type 事件类型
 * @returns 对应的颜色值
 */
export function getEventBorderColor(type: GameEventType): string {
  return EVENT_BORDER_COLORS[type];
}

/**
 * 按时间戳排序事件（最新在前）
 * @param events 事件列表
 * @returns 排序后的事件列表
 */
export function sortEventsByNewest(events: NewsFeedEvent[]): NewsFeedEvent[] {
  return [...events].sort((a, b) => {
    // 先比较年份
    if (b.timestamp.year !== a.timestamp.year) {
      return b.timestamp.year - a.timestamp.year;
    }
    // 年份相同则比较月份
    return b.timestamp.month - a.timestamp.month;
  });
}

/**
 * 格式化时间戳为显示字符串
 */
function formatTimestamp(timestamp: GameTimestamp): string {
  return `${timestamp.year}年${timestamp.month}月`;
}

/**
 * 获取事件类型的中文名称
 */
function getEventTypeName(type: GameEventType): string {
  const typeNames: Record<GameEventType, string> = {
    battle: '战争',
    domestic: '内政',
    disaster: '灾害',
    general: '武将',
  };
  return typeNames[type];
}

/**
 * 新闻流组件
 * 显示游戏事件的实时文本流，最新事件置顶
 */
export function NewsFeed({ events, autoScroll = true }: NewsFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevEventsLengthRef = useRef(events.length);

  // 排序事件，最新在前
  const sortedEvents = sortEventsByNewest(events);

  // 当有新事件时自动滚动到顶部
  useEffect(() => {
    if (autoScroll && containerRef.current && events.length > prevEventsLengthRef.current) {
      containerRef.current.scrollTop = 0;
    }
    prevEventsLengthRef.current = events.length;
  }, [events.length, autoScroll]);

  return (
    <div className="news-feed" ref={containerRef}>
      <div className="news-feed-header">
        <span className="news-feed-title">📜 历史记录</span>
      </div>
      <div className="news-feed-content">
        {sortedEvents.length === 0 ? (
          <div className="news-feed-empty">暂无事件记录</div>
        ) : (
          sortedEvents.map((event) => (
            <div
              key={event.id}
              className="news-feed-item"
              style={{ borderLeftColor: getEventBorderColor(event.type) }}
            >
              <div className="news-feed-item-header">
                <span
                  className="news-feed-item-type"
                  style={{ color: getEventBorderColor(event.type) }}
                >
                  {getEventTypeName(event.type)}
                </span>
                <span className="news-feed-item-time">{formatTimestamp(event.timestamp)}</span>
              </div>
              <div className="news-feed-item-narrative">{event.narrative}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NewsFeed;
