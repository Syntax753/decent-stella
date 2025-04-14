
interface IProps {
  htmlContent: string;
}

function DangerousHtml(props: IProps) {
  const { htmlContent } = props;
  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}


export default DangerousHtml;
