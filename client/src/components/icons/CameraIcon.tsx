import { ICON_STROKE_WIDTH, Icon, type IconProps } from "./Icon";

export function CameraIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1-1.5h6.6l1 1.5h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={ICON_STROKE_WIDTH} />
			<circle cx="12" cy="12.5" r="3.25" stroke="currentColor" strokeWidth={ICON_STROKE_WIDTH} />
		</Icon>
	);
}
