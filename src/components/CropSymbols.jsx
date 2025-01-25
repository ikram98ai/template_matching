import { FaTrash } from "react-icons/fa"; // FontAwesome trash icon

const CropSymbols = ({croppedSymbols, addCroppedSymbol, removeCroppedSymbol}) =>{

    return (
    <div >

      <div className="flex flex-row gap-2 items-center pb-3 ">
        <button  onClick={addCroppedSymbol}
        className=" bg-blue-700 hover:bg-blue-800 text-white text-3xl focus:outline-none font-medium rounded-lg px-3  text-center inline-flex items-center">
          +
        </button>
        <h2 className="text-xl font-semibold">Crop Symbol</h2>
      </div>
        <div className="grid grid-cols-3 items-center gap-2 mb-3  max-h-[30vh] overflow-y-auto pb-4">
          {croppedSymbols &&
          croppedSymbols.map((symbol, i) => (
            <div key={i} className="relative w-16 h-16">
              {/* Image */}
              <img
                src={symbol}
                alt={`Cropped Symbol ${i}`}
                className="w-full h-full border-2 rounded-lg object-contain"
              />
              {/* Trash Icon */}
              <button
                onClick={() => removeCroppedSymbol(i)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600"
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