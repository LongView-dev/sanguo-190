# Romance of the Three Kingdoms: 190 AD

> A historical strategy game set in the turbulent era of 190 AD, when warlords united against Dong Zhuo

[中文文档](./README.zh-CN.md)

## 🎮 About

In 190 AD, the Han Dynasty was in decline and chaos reigned across China. Dong Zhuo seized control of the emperor and occupied the capital cities of Luoyang and Chang'an. The eastern warlords formed a coalition led by Yuan Shao, with rising heroes like Cao Cao and Liu Bei joining the cause. However, the alliance was fragile, with each lord harboring their own ambitions.

This turn-based strategy game lets you play as a warlord, building your power through domestic development, military campaigns, and strategic diplomacy.

## ✨ Features

### 🎮 Game Systems
- **AI Decision System** - Intelligent AI with threat assessment and strategic planning
- **Battle System** - Combat calculations based on general attributes, duels, and instant kills
- **Domestic System** - Commerce/agriculture development, recruitment, resource management
- **Turn System** - Action point (AP) mechanics with monthly/yearly events
- **LLM Integration** - AI-generated historical narratives and strategic advice

### 📊 Game Content
- **4 Major Factions** - Dong Zhuo, Cao Cao, Yuan Shao, Liu Bei
- **6 Cities** - Luoyang, Chang'an, Chenliu, Nanpi, Ye, Pingyuan
- **23 Generals** - Complete attribute system (Leadership, War, Intelligence, Politics, Charisma)

### 💾 Save System
- Auto-save (every turn)
- Multi-slot manual saves
- Local persistence with LZ-String compression

### 🎨 User Interface
- Three-column layout (faction info, topology map, news feed)
- SVG topology map with city connections
- Real-time battle indicators
- Advisor dialog system
- Opening narrative animation

## 🛠 Tech Stack

- **Frontend**: React 19.2.0
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.2.4
- **State Management**: React Context
- **Testing**: Vitest 4.0.16
- **Property Testing**: fast-check 4.5.1
- **Linting**: ESLint + Prettier
- **Compression**: lz-string 1.5.0

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

Visit http://localhost:5173 to play

### Build
```bash
npm run build
```

### Testing
```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui
```

### Format Code
```bash
npm run format
```

## 📁 Project Structure

```
sanguo-190/
├── src/
│   ├── components/       # UI components
│   ├── systems/          # Game systems (AI, battle, domestic, turn)
│   ├── services/         # Services (LLM, storage, save/load)
│   ├── data/             # Game data (190 AD scenario)
│   ├── types/            # TypeScript types
│   ├── store/            # State management
│   └── App.tsx           # Main application
├── public/               # Static assets
└── package.json
```

## 🎯 Gameplay

### Action Points
- 3 AP per turn
- Domestic actions cost 1 AP (development, recruitment, search)
- Military actions cost 2 AP (campaign)
- View details costs 0 AP

### Domestic Management
- **Develop Commerce/Agriculture** - Increase city income and food production
- **Recruit** - Spend gold and population to gain soldiers
- **Search Talent** - Find wandering generals

### Military Campaigns
- **Campaign** - Attack adjacent cities
- **Battle Calculation** - Based on troops, war skill, and leadership
- **Duel System** - 5% chance when war difference ≤ 10
- **Instant Kill** - 1% chance when war difference > 20

## 📊 Completion Status

| Module | Completion | Status |
|--------|-----------|--------|
| Core Systems | 95% | ✅ Complete |
| Data Management | 100% | ✅ Complete |
| Save System | 100% | ✅ Complete |
| UI Components | 90% | ✅ Mostly Done |
| Player Actions | 40% | ⚠️ In Progress |
| Game Flow | 70% | ⚠️ In Progress |
| LLM Integration | 100% | ✅ Complete |

**Overall: ~75-80% Complete**

## 🔧 TODO

### High Priority
- [ ] Implement player domestic action logic
- [ ] Implement player military action logic
- [ ] General selection UI
- [ ] Target city selection UI

### Medium Priority
- [ ] Stratagem system
- [ ] Victory conditions
- [ ] Game over screen
- [ ] Faction elimination logic

### Low Priority
- [ ] Battle animations
- [ ] Sound effects
- [ ] Tutorial system
- [ ] Difficulty settings

## 🧪 Testing

Property-based testing ensures correctness of core logic:

- ✅ Battle system tests
- ✅ Domestic system tests
- ✅ Turn system tests
- ✅ Save/load tests
- ✅ Map system tests

## 📝 Changelog

### v0.1.0 (2026-01-10)
- ✅ Basic framework complete
- ✅ Core game systems implemented
- ✅ 190 AD scenario data complete
- ✅ Auto/manual save system
- ✅ LLM integration
- ✅ Main UI components
- ⚠️ Player action logic pending

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License

## 👨‍💻 Author

Liam Payne

---

**⚔️ The age of chaos has come. Heroes shall rise!**
