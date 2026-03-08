/* ============================================================
   types/template.ts — 템플릿·스타일 설정 타입
   videoTemplates, TEMPLATE_STYLES 를 타입 안전하게 대체
   ============================================================ */

import type { KenBurnsEffect, TransitionType } from './state';

/** Canvas 자막 렌더링 스타일 */
export interface CaptionStyle {
  font: string;
  color: string;
  stroke: string;
  strokeWidth: number;
  shadow: string;
  shadowOffsetY?: number;
  highlightColor: string;
  /** 자막 배경 반투명 박스 색상 (없으면 배경 없음) */
  bgColor?: string;
}

/** 오버레이 그라디언트 */
export interface OverlayConfig {
  top: string;
  bottom: string;
}

/** 색보정 RGB 배율 */
export interface ColorGrade {
  r: number;
  g: number;
  b: number;
}

/** 씬 뱃지(좌하단 도트) 스타일 */
export interface BadgeStyle {
  bg: string;
  dot: string;
}

/** 전체 템플릿 비주얼 설정 */
export interface TemplateStyle {
  overlay: OverlayConfig;
  subtitle: {
    color: string;
    hlColor: string;
    /** CaptionStyle.font 크기 배율 (1.0 = 기본) */
    fontSize: number;
  };
  transition: TransitionType;
  /** 시네마틱 레터박스 (상하 4% 검은 바) */
  letterbox: boolean;
  badge: BadgeStyle;
  colorGrade: ColorGrade;
}

/** 템플릿 전체 설정 (비주얼 + Canvas 자막 + 기본 씬 파라미터) */
export interface TemplateConfig {
  name: string;
  emoji: string;
  style: TemplateStyle;
  caption: CaptionStyle;
  /** 씬 기본 효과 */
  defaultEffect: KenBurnsEffect;
  /** 씬 duration 범위(초) */
  durationRange: { min: number; max: number };
}
