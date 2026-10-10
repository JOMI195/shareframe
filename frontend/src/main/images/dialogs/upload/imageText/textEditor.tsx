import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import { Image as KonvaImage, Label, Layer, Stage, Tag, Text, Transformer } from 'react-konva';
import { useTheme } from '@mui/material/styles';
import { applyTransform, backgroundPadding, backgroundRadius, FONTS, oppositeColor, TextOverlay } from './textOverlays';

const CORNER_ANCHORS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const MIN_BOX_SIZE = 10;

interface OverlayTextProps {
    overlay: TextOverlay;
    onSelect: (id: string) => void;
    onChange: (overlay: TextOverlay) => void;
    registerNode: (id: string, node: Konva.Label | null) => void;
}

const OverlayText: React.FC<OverlayTextProps> = ({ overlay, onSelect, onChange, registerNode }) => {
    const nodeRef = useRef<Konva.Label>(null);

    // x/y is the center, so rotation and resizing pivot around the middle of the text.
    useLayoutEffect(() => {
        const node = nodeRef.current;
        if (!node) return;
        node.offsetX(node.width() / 2);
        node.offsetY(node.height() / 2);
        node.getLayer()?.batchDraw();
    }, [overlay.text, overlay.fontSize, overlay.font, overlay.bold]);

    useEffect(() => {
        registerNode(overlay.id, nodeRef.current);
        return () => registerNode(overlay.id, null);
    }, [overlay.id, registerNode]);

    const select = () => onSelect(overlay.id);

    // The padding stays without a background so toggling it does not shift the text.
    return (
        <Label
            ref={nodeRef}
            x={overlay.x}
            y={overlay.y}
            rotation={overlay.rotation}
            draggable
            onMouseDown={select}
            onTouchStart={select}
            onDragStart={select}
            onDragEnd={(e) => onChange({ ...overlay, x: e.target.x(), y: e.target.y() })}
            onTransformEnd={() => {
                const node = nodeRef.current;
                if (!node) return;
                const scale = node.scaleX();
                node.scale({ x: 1, y: 1 });
                onChange(applyTransform(overlay, { x: node.x(), y: node.y(), rotation: node.rotation(), scale }));
            }}
        >
            <Tag
                fill={oppositeColor(overlay.color)}
                cornerRadius={backgroundRadius(overlay.fontSize)}
                visible={overlay.background}
            />
            <Text
                text={overlay.text}
                fontSize={overlay.fontSize}
                fontFamily={FONTS[overlay.font].family}
                fontStyle={overlay.bold ? 'bold' : 'normal'}
                align="center"
                padding={backgroundPadding(overlay.fontSize)}
                fill={overlay.color}
            />
        </Label>
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
                        {overlays.map((overlay) => (
                            <OverlayText
                                key={overlay.id}
                                overlay={overlay}
                                onSelect={onSelect}
                                onChange={onChange}
                                registerNode={registerNode}
                            />
                        ))}
                        <Transformer
                            ref={transformerRef}
                            enabledAnchors={CORNER_ANCHORS}
                            keepRatio
                            flipEnabled={false}
                            rotationSnaps={[0, 90, 180, 270]}
                            anchorSize={14}
                            padding={6}
                            borderStroke={theme.palette.primary.main}
                            anchorStroke={theme.palette.primary.main}
                            boundBoxFunc={(oldBox, newBox) =>
                                Math.abs(newBox.width) < MIN_BOX_SIZE || Math.abs(newBox.height) < MIN_BOX_SIZE ? oldBox : newBox
                            }
                        />
                    </Layer>
                </Stage>
            )}
        </div>
    );
};

export default TextEditor;
