/**
 * 城市选择菜单条件属性测试
 * **Feature: sanguo-190, Property 18: 城市选择菜单条件**
 * **Validates: Requirements 1.4, 1.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getMenuItemsForCity,
  getPlayerCityMenuItems,
  getEnemyCityMenuItems,
  type ActionMenuItem,
} from './ActionMenu';
import { INITIAL_ACTION_POINTS, AP_COST_DOMESTIC, AP_COST_CAMPAIGN } from '../../types/gameState';

// 生成器定义
const validAPArb = fc.integer({ min: 0, max: INITIAL_ACTION_POINTS });

/**
 * **Feature: sanguo-190, Property 18: 城市选择菜单条件**
 * *For any* 城市选择操作，若城市属于玩家势力则显示内政菜单，若属于敌方则显示计略菜单。
 * **Validates: Requirements 1.4, 1.5**
 */
describe('Property 18: 城市选择菜单条件', () => {
  /**
   * Requirements 1.4: 玩家城市应显示 [内政开发], [征兵], [人才探索], [出征] 选项
   */
  it('should return player city menu items when isPlayerCity is true', () => {
    fc.assert(
      fc.property(validAPArb, (currentAP) => {
        const menuItems = getMenuItemsForCity(true, currentAP);
        
        // 验证返回的是玩家城市菜单
        const actionIds = menuItems.map((item) => item.id);
        
        // 必须包含内政相关选项
        expect(actionIds).toContain('develop_commerce');
        expect(actionIds).toContain('develop_agriculture');
        expect(actionIds).toContain('recruit');
        expect(actionIds).toContain('search_talent');
        expect(actionIds).toContain('campaign');
        
        // 不应包含敌方城市选项
        expect(actionIds).not.toContain('stratagem');
        expect(actionIds).not.toContain('view_details');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Requirements 1.5: 敌方城市应显示 [计略], [查看详情] 选项
   */
  it('should return enemy city menu items when isPlayerCity is false', () => {
    fc.assert(
      fc.property(validAPArb, (currentAP) => {
        const menuItems = getMenuItemsForCity(false, currentAP);
        
        // 验证返回的是敌方城市菜单
        const actionIds = menuItems.map((item) => item.id);
        
        // 必须包含敌方城市选项
        expect(actionIds).toContain('stratagem');
        expect(actionIds).toContain('view_details');
        
        // 不应包含玩家城市选项
        expect(actionIds).not.toContain('develop_commerce');
        expect(actionIds).not.toContain('develop_agriculture');
        expect(actionIds).not.toContain('recruit');
        expect(actionIds).not.toContain('search_talent');
        expect(actionIds).not.toContain('campaign');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 验证菜单项的行动力消耗正确性
   */
  it('should correctly set AP costs for player city menu items', () => {
    fc.assert(
      fc.property(validAPArb, (currentAP) => {
        const menuItems = getPlayerCityMenuItems(currentAP);
        
        for (const item of menuItems) {
          if (item.id === 'campaign') {
            expect(item.apCost).toBe(AP_COST_CAMPAIGN);
          } else if (
            item.id === 'develop_commerce' ||
            item.id === 'develop_agriculture' ||
            item.id === 'recruit' ||
            item.id === 'search_talent'
          ) {
            expect(item.apCost).toBe(AP_COST_DOMESTIC);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 验证敌方城市菜单项无行动力消耗
   */
  it('should have zero AP cost for enemy city menu items', () => {
    const menuItems = getEnemyCityMenuItems();
    
    for (const item of menuItems) {
      expect(item.apCost).toBe(0);
    }
  });

  /**
   * 验证菜单项启用状态与行动力关系
   */
  it('should correctly enable/disable menu items based on available AP', () => {
    fc.assert(
      fc.property(validAPArb, (currentAP) => {
        const menuItems = getPlayerCityMenuItems(currentAP);
        
        for (const item of menuItems) {
          if (item.apCost > 0) {
            // 如果行动力足够，应该启用
            if (currentAP >= item.apCost) {
              expect(item.enabled).toBe(true);
            } else {
              // 如果行动力不足，应该禁用
              expect(item.enabled).toBe(false);
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 验证敌方城市菜单项始终启用
   */
  it('should always enable enemy city menu items', () => {
    const menuItems = getEnemyCityMenuItems();
    
    for (const item of menuItems) {
      expect(item.enabled).toBe(true);
    }
  });

  /**
   * 验证菜单项结构完整性
   */
  it('should return menu items with all required properties', () => {
    fc.assert(
      fc.property(fc.boolean(), validAPArb, (isPlayerCity, currentAP) => {
        const menuItems = getMenuItemsForCity(isPlayerCity, currentAP);
        
        for (const item of menuItems) {
          // 验证所有必需属性存在
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('label');
          expect(item).toHaveProperty('enabled');
          expect(item).toHaveProperty('apCost');
          expect(item).toHaveProperty('icon');
          
          // 验证属性类型
          expect(typeof item.id).toBe('string');
          expect(typeof item.label).toBe('string');
          expect(typeof item.enabled).toBe('boolean');
          expect(typeof item.apCost).toBe('number');
          expect(typeof item.icon).toBe('string');
          
          // 验证行动力消耗非负
          expect(item.apCost).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 验证菜单项数量一致性
   */
  it('should return consistent number of menu items', () => {
    fc.assert(
      fc.property(validAPArb, validAPArb, (ap1, ap2) => {
        // 玩家城市菜单项数量应该一致（不受AP影响）
        const playerItems1 = getPlayerCityMenuItems(ap1);
        const playerItems2 = getPlayerCityMenuItems(ap2);
        expect(playerItems1.length).toBe(playerItems2.length);
        
        // 敌方城市菜单项数量应该一致
        const enemyItems = getEnemyCityMenuItems();
        expect(enemyItems.length).toBe(2); // [计略], [查看详情]
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 验证玩家城市菜单项数量
   */
  it('should return exactly 5 menu items for player city', () => {
    fc.assert(
      fc.property(validAPArb, (currentAP) => {
        const menuItems = getPlayerCityMenuItems(currentAP);
        // [开发商业], [开发农业], [征兵], [人才探索], [出征]
        expect(menuItems.length).toBe(5);
      }),
      { numRuns: 100 }
    );
  });
});
