import { TokenMigration } from "@/components/TokenMigration";
import { Navbar } from "@/components/Navbar";

const Index = () => {
  return (
    <>
      <Navbar />
      <div className="h-[calc(100vh-4rem)] mt-16 bg-black text-white flex flex-col items-center px-4">
        <header className="mb-4 md:mb-8 text-center pt-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Token Migration
          </h1>
          <p className="text-gray-400 max-w-md mb-4">
            Migrate your RESAL Collateral Token (RCT) to RESAL Collateral Token V2 (RCTv2)
          </p>
        </header>
        
        <div className="w-full max-w-md">
          <TokenMigration />
        </div>
      </div>
    </>
  );
};

export default Index;
