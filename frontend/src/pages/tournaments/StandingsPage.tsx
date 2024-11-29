// pages/tournaments/StandingsPage.tsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import TournamentStandings from "../../components/tournaments/TournamentStandings";

interface StandingsParams {
 tournamentId?: string;
 divisionName?: string;
}

const StandingsPage: React.FC = () => {
 const { tournamentId, divisionName } = useParams<StandingsParams>();
 const navigate = useNavigate();

 if (!divisionName) {
   return <div>Division name is required</div>;
 }

 return (
   <div className="bg-white p-6 rounded-lg shadow-md">
     <div className="flex items-center justify-between mb-4">
       <h2 className="text-2xl font-bold">Division Standings</h2>
       <button
         onClick={() => navigate("/tournaments")}
         className="px-4 py-2 border rounded hover:bg-gray-50"
       >
         Back to List
       </button>
     </div>
     <div className="mb-4">
       <h3 className="text-xl font-semibold">
         {decodeURIComponent(divisionName)}
       </h3>
     </div>
     <TournamentStandings
       tournamentId={tournamentId}
       divisionName={decodeURIComponent(divisionName)}
     />
   </div>
 );
};

export default StandingsPage;