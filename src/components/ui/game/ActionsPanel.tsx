/**
 * 行动指令面板 - 像素风格
 */

interface ActionsPanelProps {
  actionPoints: number;
  onAction: (action: string, cost: number) => void;
  onEndTurn: () => void;
  onSave: () => void;
  onLoad: () => void;
  hasSelectedCity: boolean;
}

export function ActionsPanel({
  actionPoints,
  onAction,
  onEndTurn,
  onSave,
  onLoad,
  hasSelectedCity,
}: ActionsPanelProps) {
  const politicsActions = [
    { id: 'develop_commerce', icon: '🏪', label: '开发商业', cost: 1 },
    { id: 'develop_agriculture', icon: '🌾', label: '开发农业', cost: 1 },
    { id: 'recruit', icon: '🎖️', label: '征兵', cost: 1 },
    { id: 'search_talent', icon: '🔍', label: '人才探索', cost: 1 },
  ];

  const militaryActions = [{ id: 'campaign', icon: '⚔️', label: '出征', cost: 2, primary: true }];

  const specialActions = [
    { id: 'stratagem', icon: '📜', label: '计略', cost: 1 },
    { id: 'view_details', icon: '💬', label: '军师建议', cost: 0 },
  ];

  return (
    <div className="actions-panel">
      <h3>行动指令</h3>

      <div className="action-group">
        <div className="action-group-title">内政指令</div>
        <div className="action-buttons">
          {politicsActions.map((action) => (
            <button
              key={action.id}
              className="action-btn"
              disabled={actionPoints < action.cost || !hasSelectedCity}
              onClick={() => onAction(action.id, action.cost)}
            >
              <span className="icon">{action.icon}</span>
              <span className="label">{action.label}</span>
              <span className="cost">{action.cost} AP</span>
            </button>
          ))}
        </div>
      </div>

      <div className="action-group">
        <div className="action-group-title">军事指令</div>
        <div className="action-buttons">
          {militaryActions.map((action) => (
            <button
              key={action.id}
              className={`action-btn ${action.primary ? 'primary' : ''} danger`}
              disabled={actionPoints < action.cost || !hasSelectedCity}
              onClick={() => onAction(action.id, action.cost)}
            >
              <span className="icon">{action.icon}</span>
              <span className="label">{action.label}</span>
              <span className="cost">{action.cost} AP</span>
            </button>
          ))}
        </div>
      </div>

      <div className="action-group">
        <div className="action-group-title">特殊指令</div>
        <div className="action-buttons">
          {specialActions.map((action) => (
            <button
              key={action.id}
              className="action-btn"
              disabled={action.cost > 0 && actionPoints < action.cost}
              onClick={() => onAction(action.id, action.cost)}
            >
              <span className="icon">{action.icon}</span>
              <span className="label">{action.label}</span>
              {action.cost > 0 && <span className="cost">{action.cost} AP</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="system-buttons">
        <button className="system-btn" onClick={onEndTurn}>
          结束回合
        </button>
        <button className="system-btn" onClick={onSave}>
          存档
        </button>
        <button className="system-btn" onClick={onLoad}>
          读档
        </button>
      </div>
    </div>
  );
}
