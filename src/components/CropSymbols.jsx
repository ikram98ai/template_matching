import { FaTrash } from "react-icons/fa"; // FontAwesome trash icon
import Symbol from "./Symbol";

const CropSymbols = ({croppedSymbols, removeCroppedSymbol}) =>{

    return (
    <div >
      <h2 className="text-xl font-semibold">Cropped Symbols</h2>
      <div className="grid grid-cols-3 items-center gap-2 my-2  max-h-[30vh] overflow-y-auto pb-4">
        {croppedSymbols &&
        croppedSymbols.map((symbol, i) => (
          <div key={i} className="relative w-16 h-16">
            {/* Image */}
           
            <Symbol onClick={() => removeCroppedSymbol(i)} id={symbol.label} src={symbol.image} color={symbol.color}  />
            {/* Trash Icon */}
            <button
              onClick={() => removeCroppedSymbol(i)}
              className="absolute bottom-0 right-1 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600"
              title="Remove symbol"
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>
    </div>
    )
}

export default CropSymbols