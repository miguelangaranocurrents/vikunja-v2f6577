import type {Fragment, Node as ProseMirrorNode} from '@tiptap/pm/model'

const LIST_TYPES = new Set(['bulletList', 'orderedList', 'taskList'])

// Plain text for copied content. Unlike ProseMirror's default serializer this keeps
// list markers, so a copied bullet list still reads as a list outside the editor.
// Top-level blocks are separated by a blank line, like ProseMirror does.
export function fragmentToPlainText(fragment: Fragment): string {
	const blocks: string[] = []
	fragment.forEach(node => {
		const lines = blockLines(node, '')
		if (lines.length > 0) {
			blocks.push(lines.join('\n'))
		}
	})
	return blocks.join('\n\n')
}

function blockLines(node: ProseMirrorNode, indent: string): string[] {
	if (LIST_TYPES.has(node.type.name)) {
		const lines: string[] = []
		let number = Number(node.attrs.start ?? 1)
		node.forEach(item => {
			const marker = node.type.name === 'orderedList' ? `${number++}. ` : '- '
			lines.push(...listItemLines(item, indent, marker))
		})
		return lines
	}

	if (node.isTextblock) {
		return [indent + node.textContent]
	}

	if (node.isLeaf) {
		return []
	}

	const lines: string[] = []
	node.forEach(child => lines.push(...blockLines(child, indent)))
	return lines
}

function listItemLines(item: ProseMirrorNode, indent: string, marker: string): string[] {
	const continuation = indent + ' '.repeat(marker.length)
	const lines: string[] = []
	item.forEach((child, _offset, index) => {
		const childLines = blockLines(child, index === 0 ? indent + marker : continuation)
		if (index === 0 && childLines.length === 0) {
			lines.push(indent + marker.trimEnd())
		}
		lines.push(...childLines)
	})
	return lines
}
