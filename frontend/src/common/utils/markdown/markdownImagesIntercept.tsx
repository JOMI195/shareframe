import React from 'react';
import ReactMarkdown, { Components, Options } from 'react-markdown';
import AuthenticatedImage from "@/common/components/authenticatedImage";

interface MarkdownImagesInterceptProps extends Omit<Options, 'children' | 'components'> {
    children: string;
}

/**
 * Component that renders markdown content while intercepting image tags
 * to use AuthenticatedImage component for fetching images with authentication
 */
const MarkdownImagesIntercept: React.FC<MarkdownImagesInterceptProps> = ({
    children,
    ...props
}) => {
    // Custom components object for react-markdown
    const components: Components = {
        // Override the img renderer
        img: ({ node, src, alt, title, onClick, ...imgProps }) => {
            if (!src) return null;

            // Convert the React onClick handler to the format expected by AuthenticatedImage
            const handleClick = onClick ? () => {
                // This adapter function drops the event parameter
                onClick({} as React.MouseEvent<HTMLImageElement>);
            } : undefined;

            return (
                <AuthenticatedImage
                    url={src}
                    alt={alt || ''}
                    style={{
                        maxWidth: '100%',
                        height: 'auto'
                    }}
                    onClick={handleClick}
                    // Don't spread the remaining imgProps as they may contain incompatible props
                    className={imgProps.className}
                />
            );
        },
    };

    return (
        <ReactMarkdown components={components} {...props}>
            {children}
        </ReactMarkdown>
    );
};

export default MarkdownImagesIntercept;