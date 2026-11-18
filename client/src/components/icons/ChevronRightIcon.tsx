import { ICON_STROKE_WIDTH, Icon, type IconProps } from "./Icon";

export function ChevronRightIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="m9 18 6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={ICON_STROKE_WIDTH} />
		</Icon>
	);
}
