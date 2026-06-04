import { Config } from "../config/config"
import { Card, Skill } from "../maker/card"
import { Vector } from '../entity/Vector'
import { Rect } from '../entity/Rect'
import { transColor } from "../util/transcolor"
import { Miscellaneous } from "./miscellaneous"
import { applyText } from "./textstyle"
import * as df from "../fonts/dynamicFont"
import { CanvasTool, tempCanvas } from "../entity/CanvasTool"

const SKILL_NAME_MIN_LEN = 2
const SKILL_NAME_MAX_LEN = 5

interface SkillNameLayout {
    text: string
    frameX: number
    frameW: number
    nameX: number
    textX1: number
    textW: number
}

function clampSkillName(text: string) {
    return text.slice(0, SKILL_NAME_MAX_LEN)
}

function getSkillNameColumnLen(card: Card) {
    let maxLen = SKILL_NAME_MIN_LEN
    for (const skill of card.skills) {
        maxLen = Math.max(maxLen, clampSkillName(skill.name).length)
    }
    return Math.min(maxLen, SKILL_NAME_MAX_LEN)
}

function getSkillNameLayout(cf: Config, skillName: string, nameColumnLen: number): SkillNameLayout {
    const text = clampSkillName(skillName)
    const extraWidth = Math.max(0, nameColumnLen - SKILL_NAME_MIN_LEN) * cf.skName.fontSize

    return {
        text,
        frameX: cf.skText.x1 + cf.skFrame.xoff,
        frameW: cf.skFrame.w + extraWidth,
        nameX: cf.skText.x1 + cf.skName.xoff,
        textX1: cf.skText.x1 + extraWidth,
        textW: cf.skText.w - extraWidth,
    }
}

function drawLine(cf: Config, cvt: CanvasTool, line: string, fontSize: number, isItalic: boolean, lastLine: boolean, drawRatio = 0, y: number, xoff: number, textX1: number, textW: number) {
    let font = fontSize + "px FangZhengZhuYuan"
    font = isItalic ? 'italic ' + font : font

    const w1 = cvt.ctx.measureText(line).width
    const size = new Vector(w1, fontSize * 2)
    const tempCvs = tempCanvas(size, size, 1.5)
    tempCvs.ctx.font = font
    applyText(tempCvs.ctx, cf.skText.textStyle)
    tempCvs.ctx.fillText(line, 0, size.y / 2)

    if (line.length >= 3 && line[2] === '技') {
        let boldText = line.slice(0, 4)
        if (line.length >= 7 && line[6] === '技') {
            boldText = boldText + line.slice(4, 7)
        }
        const clearWidth = tempCvs.ctx.measureText(boldText).width
        tempCvs.ctx.clearRect(0, 0, clearWidth, size.y)
        tempCvs.ctx.font = 'bold ' + font
        tempCvs.ctx.fillText(boldText, 0, size.y / 2)
    }

    let w2 = textW - xoff
    w2 = lastLine ? w1 : w2
    w2 = lastLine && drawRatio ? w1 * drawRatio : w2
    const d = {
        x: textX1 + xoff,
        y: y - size.y / 2,
        w: w2,
        h: size.y
    }

    cvt.ctx.drawImage(tempCvs.canvas, d.x, d.y, d.w, d.h)

    return w2 / w1
}

function skillHeight(cf: Config, cvt: CanvasTool, skill: Skill, layout: SkillNameLayout, isDraw: boolean = false, y: number, fontSize: number) {
    let line = ''
    let height = 0
    let numline = 0
    const text = skill.text
    const yoff = fontSize * (1 + cf.skText.rowSpacing)

    applyText(cvt.ctx, cf.skText.textStyle)
    cvt.ctx.font = fontSize + "px FangZhengZhuYuan"

    let xoff = 0
    let drawRatio = 0

    for (let i = 0; i < text.length; i++) {
        xoff = (numline === 0) ? cf.skText.indent * fontSize : 0
        line = line + text[i]
        const textWidth = cvt.ctx.measureText(line).width
        if (textWidth + cf.skText.epsilon * fontSize >= layout.textW - xoff) {
            if (i + 1 < text.length && [',', '，', '.', '。', ';', '；', ':', '：'].indexOf(text[i + 1]) >= 0) {
                i = i + 1
                line = line + text[i]
            }
            if (isDraw) {
                drawRatio = drawLine(cf, cvt, line, fontSize, skill.isItalic, false, drawRatio, y + numline * yoff, xoff, layout.textX1, layout.textW)
            }
            numline++
            line = ''
            height = height + yoff
        }
    }

    if (line != '') {
        height = height + yoff
        if (isDraw) {
            drawRatio = drawLine(cf, cvt, line, fontSize, skill.isItalic, true, drawRatio, y + numline * yoff, xoff, layout.textX1, layout.textW)
        }
    }
    return height
}

function skillsHeight(cf: Config, cvt: CanvasTool, card: Card, y1: number, fontSize: number, isDraw: boolean) {
    let heights = 0
    const skillsy: number[] = []
    const nameLayouts: SkillNameLayout[] = []
    const nameColumnLen = getSkillNameColumnLen(card)

    for (let skill of card.skills) {
        const layout = getSkillNameLayout(cf, skill.name, nameColumnLen)
        const spacing = heights > 0 ? cf.skText.spacing * fontSize : 0
        skillsy.push(y1 + heights + spacing + fontSize / 2)
        const height = skillHeight(cf, cvt, skill, layout, isDraw, y1 + heights + spacing + fontSize / 2, fontSize)
        heights = heights + spacing + height
        nameLayouts.push(layout)
    }

    return {
        height: heights,
        skillsy: skillsy,
        nameLayouts: nameLayouts,
        nameColumnLen: nameColumnLen
    }
}

function drawCornerRect(cvt: CanvasTool, rect: Rect, corner: number, isFill = false) {
    const line = rect.getCornerOutline(corner)
    cvt.ctx.beginPath()
    cvt.ctx.lineTo(line[0].x, line[0].y)
    for (let c of line.slice(1, line.length)) {
        cvt.ctx.lineTo(c.x, c.y)
    }
    isFill ? cvt.ctx.fill() : cvt.ctx.stroke()
    cvt.ctx.closePath()
}

function drawSkillBackground(cf: Config, cvt: CanvasTool, card: Card, miscellaneous: Miscellaneous, y1: number, textX1: number, textW: number) {
    const alpha = transColor(cf.skBg.alpha)
    const color = miscellaneous.getColor(card.power) + alpha

    const height = cf.skText.y2 - y1
    let rect = new Rect(textX1, y1, textW, height)
    rect = rect.scaleWidth(cf.skBg.wScale).scaleHeight(cf.skBg.hScale)

    cvt.ctx.fillStyle = color
    cvt.ctx.lineWidth = cf.skBg.lineWidth
    cvt.ctx.strokeStyle = color

    drawCornerRect(cvt, rect, cf.skBg.corner, false)
    drawCornerRect(cvt, rect.scale(-cf.skBg.margin), cf.skBg.corner, true)
}

function drawSkillNameFrames(cf: Config, cvt: CanvasTool, card: Card, miscellaneous: Miscellaneous, skillsy: number[], nameLayouts: SkillNameLayout[]) {
    const s = miscellaneous.getSkillbox(card.power)
    const img = miscellaneous.getImg()
    if (img) {
        for (let i = 0; i < skillsy.length; i++) {
            const dy = skillsy[i]
            const layout = nameLayouts[i]
            const d = {
                x: layout.frameX,
                y: dy + cf.skFrame.yoff,
                w: layout.frameW,
                h: cf.skFrame.h
            }
            cvt.ctx.drawImage(img, s.x, s.y, s.w, s.h, d.x, d.y, d.w, d.h)
        }
    }
}

function drawSkillNames(cf: Config, cvt: CanvasTool, card: Card, skillsy: number[], nameLayouts: SkillNameLayout[]) {
    const textStyle = card.power === 'shen' ? cf.skName.shenTextStyle : cf.skName.textStyle
    applyText(cvt.ctx, textStyle)

    for (let i = 0; i < card.skills.length; i++) {
        const dy = skillsy[i]
        const layout = nameLayouts[i]
        const text = layout.text
        const fontName = 'FangZhengLiShuJianTi'
        df.fontsTexts.fangzhengTexts = df.contrastAddFont(df.fontsTexts.fangzhengTexts, text, fontName, `/fonts/fonts/${fontName}/${fontName}`)

        for (let j = 0; j < Math.min(text.length, SKILL_NAME_MAX_LEN); j++) {
            cvt.ctx.font = cf.skName.fontSize + "px " + fontName + "-" + text[j]
            const d = {
                x: layout.nameX + j * cf.skName.fontSize,
                y: dy + cf.skName.yoff
            }
            cvt.ctx.fillText(text[j], d.x, d.y)
        }
    }
}

export function drawSkills(cf: Config, cvt: CanvasTool, card: Card, miscellaneous: Miscellaneous) {
    const maxHeight = (cf.skText.y2 - cf.skText.maxy1) * cf.skText.maxHeight
    let y1 = cf.skText.maxy1
    let fontSize = cf.skText.maxFont

    let sh = skillsHeight(cf, cvt, card, y1, fontSize, false)
    while (fontSize >= 2 && sh.height > maxHeight) {
        fontSize--
        sh = skillsHeight(cf, cvt, card, y1, fontSize, false)
    }
    y1 = Math.min(cf.skText.y2 - sh.height, cf.skText.maxy1)

    const extraWidth = Math.max(0, sh.nameColumnLen - SKILL_NAME_MIN_LEN) * cf.skName.fontSize
    const textX1 = cf.skText.x1 + extraWidth
    const textW = cf.skText.w - extraWidth

    drawSkillBackground(cf, cvt, card, miscellaneous, y1, textX1, textW)

    sh = skillsHeight(cf, cvt, card, y1, fontSize, true)
    drawSkillNameFrames(cf, cvt, card, miscellaneous, sh.skillsy, sh.nameLayouts)
    drawSkillNames(cf, cvt, card, sh.skillsy, sh.nameLayouts)

    return { topy: y1 }
}
