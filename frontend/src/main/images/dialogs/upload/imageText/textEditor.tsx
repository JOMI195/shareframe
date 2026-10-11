import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import { Image as KonvaImage, Label, Layer, Rect, Stage, Tag, Text, Transformer } from 'react-konva';
import { useTheme } from '@mui/material/styles';
import type { Box } from 'konva/lib/shapes/Transformer';
import { Bounds, passepartoutShade, safeArea } from '../passepartout';
import {
    applyTransform,
    applyWidthTransform,
    backgroundPadding,
    backgroundRadius,
    boxCenter,
    clampCenter,
    fitsSafeArea,
    FONTS,
    oppositeColor,
    TextOverlay,
    wrapWidth,
} from './textOverlays';

const CORNER_ANCHORS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const WIDTH_ANCHORS = ['middle-left', 'middle-right'];
const MIN_BOX_SIZE = 10;
const CLAMP_TOLERANCE = 0.5;
// Konva subtracts the padding again before wrapping, rounding noise must not break a line that fits.
const WRAP_TOLERANCE = 0.5;
const EDITOR_ONLY = 'editor-only';

const textStyle = (overlay: Pick<TextOverlay, 'text' | 'fontSize' | 'font' | 'bold'>) => ({
    text: overlay.text,
    fontSize: overlay.fontSize,
    fontFamily: FONTS[overlay.font].family,
    fontStyle: overlay.bold ? 'bold' : 'normal',
    padding: backgroundPadding(overlay.fontSize),
});

const measureWidth = (overlay: Parameters<typeof textStyle>[0]) => {
    const text = new Konva.Text(textStyle(overlay));
    const width = text.width();
    text.destroy();
    return width;
};

const centerOffsets = (node: Konva.Label) => {
    node.offsetX(node.width() / 2);
    node.offsetY(node.height() / 2);
};

interface OverlayTextProps {
    overlay: TextOverlay;
    safe: Bounds;
    scale: number;
    isWidthResize: () => boolean;
    onSelect: (id: string) => void;
    onChange: (overlay: TextOverlay) => void;
    registerNode: (id: string, node: Konva.Label | null) => void;
}

const OverlayText: React.FC<OverlayTextProps> = ({ overlay, safe, scale, isWidthResize, onSelect, onChange, registerNode }) => {
    const nodeRef = useRef<Konva.Label>(null);
    const textRef = useRef<Konva.Text>(null);
    const { text, fontSize, font, bold } = overlay;
    const naturalWidth = useMemo(() => measureWidth({ text, fontSize, font, bold }), [text, fontSize, font, bold]);
    const width = wrapWidth(overlay, naturalWidth, safe);

    // x/y is the center, so rotation and resizing pivot around the middle of the text.
    useLayoutEffect(() => {
        const node = nodeRef.current;
        if (!node) return;
        centerOffsets(node);
        node.getLayer()?.batchDraw();
    }, [text, fontSize, font, bold, width]);

    // Growing text or a preset from a larger crop can reach into the passepartout.
    useLayoutEffect(() => {
        const node = nodeRef.current;
        if (!node) return;
        const center = clampCenter(overlay, node.size(), overlay.rotation, safe);
        if (Math.abs(center.x - overlay.x) > CLAMP_TOLERANCE || Math.abs(center.y - overlay.y) > CLAMP_TOLERANCE) {
            onChange({ ...overlay, ...center });
        }
    }, [overlay, safe, width, onChange]);

    useEffect(() => {
        registerNode(overlay.id, nodeRef.current);
        return () => registerNode(overlay.id, null);
    }, [overlay.id, registerNode]);

    const select = () => onSelect(overlay.id);

    const dragBound = (pos: Konva.Vector2d) => {
        const node = nodeRef.current;
        if (!node) return pos;
        const center = clampCenter({ x: pos.x / scale, y: pos.y / scale }, node.size(), node.rotation(), safe);
        return { x: center.x * scale, y: center.y * scale };
    };

    // Side handles change the line width instead of stretching the glyphs.
    const onTransform = () => {
        const node = nodeRef.current;
        const textNode = textRef.current;
        if (!node || !textNode || !isWidthResize()) return;
        textNode.width(Math.max(overlay.fontSize, node.width() * node.scaleX()));
        node.scaleX(1);
        centerOffsets(node);
    };

    const onTransformEnd = () => {
        const node = nodeRef.current;
        const textNode = textRef.current;
        if (!node || !textNode) return;
        if (isWidthResize()) {
            onChange(applyWidthTransform(overlay, { x: node.x(), y: node.y(), width: textNode.width() }));
            return;
        }
        const nodeScale = node.scaleX();
        node.scale({ x: 1, y: 1 });
        onChange(applyTransform(overlay, { x: node.x(), y: node.y(), rotation: node.rotation(), scale: nodeScale }));
    };

    // The padding stays without a background so toggling it does not shift the text.
    return (
        <Label
            ref={nodeRef}
            x={overlay.x}
            y={overlay.y}
            rotation={overlay.rotation}
            draggable
            dragBoundFunc={dragBound}
            onMouseDown={select}
            onTouchStart={select}
            onDragStart={select}
            onDragEnd={(e) => onChange({ ...overlay, x: e.target.x(), y: e.target.y() })}
            onTransform={onTransform}
            onTransformEnd={onTransformEnd}
        >
            <Tag
                fill={oppositeColor(overlay.color)}
                cornerRadius={backgroundRadius(overlay.fontSize)}
                visible={overlay.background}
            />
            <Text
                ref={textRef}
                {...textStyle(overlay)}
                width={width + WRAP_TOLERANCE}
                wrap="word"
                align="center"
                fill={overlay.color}
            />
        </Label>
    );
};

const Passepartout: React.FC<{ image: HTMLImageElement; safe: Bounds; scale: number }> = ({ image, safe, scale }) => {
    const theme = useTheme();
    const shade = passepartoutShade(theme.palette.mode);
    const bands = [
        { x: 0, y: 0, width: image.width, height: safe.y },
        { x: 0, y: safe.y + safe.height, width: image.width, height: image.height - safe.y - safe.height },
        { x: 0, y: safe.y, width: safe.x, height: safe.height },
        { x: safe.x + safe.width, y: safe.y, width: image.width - safe.x - safe.width, height: safe.height },
    ];

    return (
        <>
            {bands.map((band, index) => (
                <Rect key={index} {...band} fill={shade} name={EDITOR_ONLY} listening={false} />
            ))}
            <Rect
                {...safe}
                stroke={theme.palette.text.secondary}
                strokeWidth={1 / scale}
                dash={[6 / scale, 4 / scale]}
                name={`${EDITOR_ONLY} safe-area`}
                listening={false}
            />
        </>
    );
};

interface TextEditorProps {
    image: HTMLImageElement;
    overlays: TextOverlay[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onChange: (overlay: TextOverlay) => void;
    onDelete: (id: string) => void;
    stageRef: React.RefObject<Konva.Stage | null>;
}

const TextEditor: React.FC<TextEditorProps> = ({
    image,
    overlays,
    selectedId,
    onSelect,
    onChange,
    onDelete,
    stageRef,
}) => {
    const theme = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const nodesRef = useRef(new Map<string, Konva.Label>());
    const [displayWidth, setDisplayWidth] = useState(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        setDisplayWidth(container.clientWidth);
        const observer = new ResizeObserver(([entry]) => setDisplayWidth(entry.contentRect.width));
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    const registerNode = React.useCallback((id: string, node: Konva.Label | null) => {
        if (node) {
            nodesRef.current.set(id, node);
        } else {
            nodesRef.current.delete(id);
        }
    }, []);

    useEffect(() => {
        const transformer = transformerRef.current;
        if (!transformer) return;
        const node = selectedId ? nodesRef.current.get(selectedId) : undefined;
        transformer.nodes(node ? [node] : []);
        transformer.forceUpdate();
        transformer.getLayer()?.batchDraw();
    }, [selectedId, overlays, displayWidth]);

    const scale = displayWidth / image.width;
    const safe = useMemo(() => safeArea(image.width, image.height), [image]);

    const isWidthResize = React.useCallback(
        () => WIDTH_ANCHORS.includes(transformerRef.current?.getActiveAnchor() ?? ''),
        []
    );

    // Shrinking stays possible, so a text that already overflows can be fixed.
    const boundBox = (oldBox: Box, newBox: Box) => {
        if (Math.abs(newBox.width) < MIN_BOX_SIZE || Math.abs(newBox.height) < MIN_BOX_SIZE) return oldBox;
        const center = boxCenter(newBox);
        const fits = fitsSafeArea(
            { x: center.x / scale, y: center.y / scale },
            { width: newBox.width / scale, height: newBox.height / scale },
            (newBox.rotation * 180) / Math.PI,
            safe
        );
        if (fits) return newBox;
        const shrinking = newBox.width <= oldBox.width && newBox.height <= oldBox.height && newBox.rotation === oldBox.rotation;
        return shrinking ? newBox : oldBox;
    };

    const deselectOnEmpty = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (e.target === e.target.getStage()) onSelect(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (selectedId && (e.key === 'Delete' || e.key === 'Backspace')) {
            e.preventDefault();
            onDelete(selectedId);
        }
    };

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label="Text-Editor"
            style={{
                width: '100%',
                aspectRatio: `${image.width} / ${image.height}`,
                outline: 'none',
                backgroundColor: theme.palette.mode === 'light' ? '#e0e0e0' : '#000000',
                touchAction: 'none',
            }}
        >
            {displayWidth > 0 && (
                <Stage
                    ref={stageRef}
                    width={displayWidth}
                    height={image.height * scale}
                    scaleX={scale}
                    scaleY={scale}
                    onMouseDown={deselectOnEmpty}
                    onTouchStart={deselectOnEmpty}
                >
                    <Layer>
                        <KonvaImage image={image} listening={false} />
                        <Passepartout image={image} safe={safe} scale={scale} />
                        {overlays.map((overlay) => (
                            <OverlayText
                                key={overlay.id}
                                overlay={overlay}
                                safe={safe}
                                scale={scale}
                                isWidthResize={isWidthResize}
                                onSelect={onSelect}
                                onChange={onChange}
                                registerNode={registerNode}
                            />
                        ))}
                        <Transformer
                            ref={transformerRef}
                            enabledAnchors={[...CORNER_ANCHORS, ...WIDTH_ANCHORS]}
                            keepRatio
                            flipEnabled={false}
                            rotationSnaps={[0, 90, 180, 270]}
                            anchorSize={14}
                            padding={6}
                            borderStroke={theme.palette.primary.main}
                            anchorStroke={theme.palette.primary.main}
                            boundBoxFunc={boundBox}
                        />
                    </Layer>
                </Stage>
            )}
        </div>
    );
};

export default TextEditor;
