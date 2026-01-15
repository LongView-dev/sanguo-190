/**
 * 游戏头部组件 - 像素风格
 */

interface GameHeaderProps {
  currentTurn: { year: number; month: number };
  factionName: string;
}

export function GameHeader({ currentTurn, factionName }: GameHeaderProps) {
  return (
    <header className="game-header">
      <div className="game-title">
        {/* 像素风图标 */}
        <svg className="game-title-icon" viewBox="0 0 32 32" fill="none">
          {/* 像素风剑图标 */}
          <rect x="14" y="2" width="4" height="20" fill="#c9a227" />
          <rect x="15" y="3" width="2" height="18" fill="#ffd700" />
          <rect x="8" y="20" width="16" height="4" fill="#8b6914" />
          <rect x="10" y="21" width="12" height="2" fill="#c9a227" />
          <rect x="14" y="24" width="4" height="6" fill="#5a4a3a" />
          <rect x="15" y="25" width="2" height="4" fill="#8b7355" />
        </svg>
        <h1>三国志·群雄割据</h1>
      </div>

      <div className="header-controls">
        <div className="turn-indicator">
          {/* 像素风日历图标 */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect
              x="2"
              y="4"
              width="12"
              height="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect x="4" y="2" width="2" height="4" fill="currentColor" />
            <rect x="10" y="2" width="2" height="4" fill="currentColor" />
            <rect x="2" y="8" width="12" height="2" fill="currentColor" />
          </svg>
          <span>
            {currentTurn.year}年{currentTurn.month}月
          </span>
        </div>
        <div className="turn-indicator">
          {/* 像素风城池图标 */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="10" width="12" height="4" fill="currentColor" />
            <rect x="4" y="4" width="8" height="6" fill="currentColor" />
            <polygon points="8,0 2,6 14,6" fill="currentColor" />
            <rect x="6" y="8" width="4" height="6" fill="#0a0a12" />
          </svg>
          <span>{factionName}</span>
        </div>
      </div>
    </header>
  );
}
