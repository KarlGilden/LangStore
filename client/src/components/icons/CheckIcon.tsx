import { ICON_STROKE_WIDTH, Icon, type IconProps } from "./Icon";

export function CheckIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="m5 12.5 4.25 4.25L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={ICON_STROKE_WIDTH} />
		</Icon>
	);
}
