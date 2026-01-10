import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isValidAttribute,
  isValidGeneralAttributes,
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
  type GeneralAttributes,
} from './general';

/**
 * **Feature: sanguo-190, Property 1: 武将属性范围约束**
 * *For any* 武将对象，其五维属性（统帅、武力、智力、政治、魅力）的值必须在 0-100 范围内。
 * **Validates: Requirements 4.1**
 */
describe('Property 1: 武将属性范围约束', () => {
  // 有效属性生成器 (0-100)
  const validAttributeArb = fc.integer({ min: ATTRIBUTE_MIN, max: ATTRIBUTE_MAX });

  // 有效武将属性生成器
  const validGeneralAttributesArb: fc.Arbitrary<GeneralAttributes> = fc.record({
    lead: validAttributeArb,
    war: validAttributeArb,
    int: validAttributeArb,
    pol: validAttributeArb,
    cha: validAttributeArb,
  });

  // 无效属性生成器 (超出范围)
  const invalidAttributeArb = fc.oneof(
    fc.integer({ max: ATTRIBUTE_MIN - 1 }), // 小于0
    fc.integer({ min: ATTRIBUTE_MAX + 1, max: 1000 }) // 大于100
  );

  it('should accept all attributes in valid range [0, 100]', () => {
    fc.assert(
      fc.property(validAttributeArb, (value) => {
        expect(isValidAttribute(value)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject attributes outside valid range', () => {
    fc.assert(
      fc.property(invalidAttributeArb, (value) => {
        expect(isValidAttribute(value)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should validate complete general attributes when all in range', () => {
    fc.assert(
      fc.property(validGeneralAttributesArb, (attrs) => {
        expect(isValidGeneralAttributes(attrs)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject general attributes when any attribute is out of range', () => {
    // 生成一个有效属性集，然后随机替换一个为无效值
    const invalidGeneralAttributesArb = fc
      .tuple(validGeneralAttributesArb, invalidAttributeArb, fc.integer({ min: 0, max: 4 }))
      .map(([attrs, invalidValue, index]) => {
        const keys: (keyof GeneralAttributes)[] = ['lead', 'war', 'int', 'pol', 'cha'];
        return {
          ...attrs,
          [keys[index]]: invalidValue,
        };
      });

    fc.assert(
      fc.property(invalidGeneralAttributesArb, (attrs) => {
        expect(isValidGeneralAttributes(attrs)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle boundary values correctly', () => {
    // 边界值测试
    expect(isValidAttribute(ATTRIBUTE_MIN)).toBe(true); // 0
    expect(isValidAttribute(ATTRIBUTE_MAX)).toBe(true); // 100
    expect(isValidAttribute(ATTRIBUTE_MIN - 1)).toBe(false); // -1
    expect(isValidAttribute(ATTRIBUTE_MAX + 1)).toBe(false); // 101
  });
});
