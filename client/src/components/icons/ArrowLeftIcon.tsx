import { ICON_STROKE_WIDTH, Icon, type IconProps } from "./Icon";

export function ArrowLeftIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={ICON_STROKE_WIDTH} />
		</Icon>
	);
}
