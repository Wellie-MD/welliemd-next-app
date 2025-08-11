export const Logo = () => {
  return (
    <div className="flex items-center gap-2 mb-8">
      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
        <div className="w-4 h-4 bg-white rounded-sm"></div>
      </div>
      <div>
        <span className="text-xl font-bold text-foreground">Kickstart</span>
        <span className="text-xl font-bold text-muted-foreground ml-1">Social.co</span>
      </div>
    </div>
  );
};