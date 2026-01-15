/**
 * 新闻事件面板 - 像素风格
 */

import type { GameEvent } from '../../../types/events';

interface NewsPanelProps {
  events: GameEvent[];
}

export function NewsPanel({ events }: NewsPanelProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'battle':
        return '⚔️';
      case 'domestic':
        return '🏛️';
      case 'disaster':
        return '🌪️';
      case 'general':
        return '🧑‍✈️';
      default:
        return '📜';
    }
  };

  return (
    <>
      <div className="news-header">
        <h3>
          <span>📜</span>
          天下大事
        </h3>
        <span className="news-badge">{events.length}</span>
      </div>
      <div className="news-list">
        {events.map((event) => (
          <div key={event.id} className="news-item">
            <div className="news-item-header">
              <span className="news-type-icon">{getTypeIcon(event.type)}</span>
              <span className="news-timestamp">
                {event.timestamp.year}年{event.timestamp.month}月
              </span>
            </div>
            <div className="news-content">{event.narrative || '事件发生...'}</div>
          </div>
        ))}
        {events.length === 0 && (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
            }}
          >
            暂无新闻事件
          </div>
        )}
      </div>
    </>
  );
}
