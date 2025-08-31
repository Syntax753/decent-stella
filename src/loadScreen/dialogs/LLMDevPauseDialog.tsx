import OkayDialog from "@/components/modalDialogs/OkayDialog";

const description = `This dialog pauses things before doing the heavy work of loading the LLM, ` +
                    `which could otherwise be triggered on each code change. ` + 
                    `If the web app is deployed to a non-local server, you won't see this dialog.`;

type Props = {
  isOpen:boolean,
  onConfirm:()=>void
}

function LLMDevPauseDialog(props:Props) {
  const { isOpen, onConfirm } = props;

  if (!isOpen) return null;

  return (
    <OkayDialog 
      title="Local Development" isOpen={isOpen} 
      onOkay={onConfirm} okayText="Load LLM" 
      description={description} 
    />
  );
}

export default LLMDevPauseDialog;