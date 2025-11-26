export default function SingleChatPage({
  params,
}: {
  params: { chatId: string };
}) {
  return (
    <div>
      <h1>Chat: {params.chatId}</h1>
    </div>
  );
}
