/**
 * 游戏美术资源索引
 * 统一管理所有图片资源的导入和导出
 */

// ========== 武将头像 ==========
import dongzhuoPortrait from './generals/dongzhuo.png';
import lvbuPortrait from './generals/lvbu.png';
import liruPortrait from './generals/liru.png';
import huaxiongPortrait from './generals/huaxiong.png';
import lijuePortrait from './generals/lijue.png';
import guosiPortrait from './generals/guosi.png';
import caocaoPortrait from './generals/caocao.png';
import xiaohoudunPortrait from './generals/xiaohoudun.png';
import xiahouyuanPortrait from './generals/xiahouyuan.png';
import caorenPortrait from './generals/caoren.png';
import caohongPortrait from './generals/caohong.png';
import yuanshaoPortrait from './generals/yuanshao.png';
import yanliangPortrait from './generals/yanliang.png';
import wenchouPortrait from './generals/wenchou.png';
import jushouPortrait from './generals/jushou.png';
import tianfengPortrait from './generals/tianfeng.png';
import liubeiPortrait from './generals/liubei.png';
import guanyuPortrait from './generals/guanyu.png';
import zhangfeiPortrait from './generals/zhangfei.png';

// ========== 势力旗帜 ==========
import dongzhuoBanner from './factions/dongzhuo_banner.png';
import caocaoBanner from './factions/caocao_banner.png';
import yuanshaoBanner from './factions/yuanshao_banner.png';
import liubeiBanner from './factions/liubei_banner.png';

// ========== 城市插画 ==========
import luoyangCity from './cities/luoyang.png';
import changanCity from './cities/changan.png';
import chenliuCity from './cities/chenliu.png';
import nanpiCity from './cities/nanpi.png';
import yeCity from './cities/ye.png';
import pingyuanCity from './cities/pingyuan.png';

// ========== UI背景元素 ==========
import gameBackground from './ui/game_background.png';
import battleBackground from './ui/battle_background.png';
import scrollFrame from './ui/scroll_frame.png';
import titleLogo from './ui/title_logo.png';

// ========== 资源图标 ==========
import goldIcon from './ui/gold_icon.png';
import grainIcon from './ui/grain_icon.png';
import troopsIcon from './ui/troops_icon.png';
import commerceIcon from './ui/commerce_icon.png';
import agricultureIcon from './ui/agriculture_icon.png';
import populationIcon from './ui/population_icon.png';
import defenseIcon from './ui/defense_icon.png';
import loyaltyIcon from './ui/loyalty_icon.png';
import actionPointIcon from './ui/action_point_icon.png';
import swordIcon from './ui/sword_icon.png';
import diplomacyIcon from './ui/diplomacy_icon.png';

/**
 * 武将头像映射表
 * 使用武将ID作为key
 */
export const GENERAL_PORTRAITS: Record<string, string> = {
    // 董卓势力
    dongzhuo: dongzhuoPortrait,
    lvbu: lvbuPortrait,
    liru: liruPortrait,
    huaxiong: huaxiongPortrait,
    lijue: lijuePortrait,
    guosi: guosiPortrait,
    // 曹操势力
    caocao: caocaoPortrait,
    xiaohoudun: xiaohoudunPortrait,
    xiahouyuan: xiahouyuanPortrait,
    caoren: caorenPortrait,
    caohong: caohongPortrait,
    // 袁绍势力
    yuanshao: yuanshaoPortrait,
    yanliang: yanliangPortrait,
    wenchou: wenchouPortrait,
    jushou: jushouPortrait,
    tianfeng: tianfengPortrait,
    // 刘备势力
    liubei: liubeiPortrait,
    guanyu: guanyuPortrait,
    zhangfei: zhangfeiPortrait,
};

/**
 * 势力旗帜映射表
 * 使用势力ID作为key
 */
export const FACTION_BANNERS: Record<string, string> = {
    dongzhuo: dongzhuoBanner,
    caocao: caocaoBanner,
    yuanshao: yuanshaoBanner,
    liubei: liubeiBanner,
};

/**
 * 城市插画映射表
 * 使用城市ID作为key
 */
export const CITY_IMAGES: Record<string, string> = {
    luoyang: luoyangCity,
    changan: changanCity,
    chenliu: chenliuCity,
    nanpi: nanpiCity,
    ye: yeCity,
    pingyuan: pingyuanCity,
};

/**
 * 资源图标映射表
 */
export const RESOURCE_ICONS = {
    gold: goldIcon,
    grain: grainIcon,
    troops: troopsIcon,
    commerce: commerceIcon,
    agriculture: agricultureIcon,
    population: populationIcon,
    defense: defenseIcon,
    loyalty: loyaltyIcon,
    actionPoint: actionPointIcon,
    sword: swordIcon,
    diplomacy: diplomacyIcon,
} as const;

/**
 * UI背景元素
 */
export const UI_BACKGROUNDS = {
    gameBackground,
    battleBackground,
    scrollFrame,
    titleLogo,
} as const;

/**
 * 获取武将头像
 * @param generalId 武将ID
 * @returns 头像图片路径，如果不存在返回undefined
 */
export function getGeneralPortrait(generalId: string): string | undefined {
    return GENERAL_PORTRAITS[generalId];
}

/**
 * 获取势力旗帜
 * @param factionId 势力ID
 * @returns 旗帜图片路径，如果不存在返回undefined
 */
export function getFactionBanner(factionId: string): string | undefined {
    return FACTION_BANNERS[factionId];
}

/**
 * 获取城市插画
 * @param cityId 城市ID
 * @returns 城市图片路径，如果不存在返回undefined
 */
export function getCityImage(cityId: string): string | undefined {
    return CITY_IMAGES[cityId];
}

/**
 * 获取资源图标
 * @param resourceType 资源类型
 * @returns 图标图片路径
 */
export function getResourceIcon(resourceType: keyof typeof RESOURCE_ICONS): string {
    return RESOURCE_ICONS[resourceType];
}

// 默认导出所有资源
export default {
    generals: GENERAL_PORTRAITS,
    factions: FACTION_BANNERS,
    cities: CITY_IMAGES,
    resources: RESOURCE_ICONS,
    ui: UI_BACKGROUNDS,
};
