import { FaTrash } from "react-icons/fa"; // FontAwesome trash icon

const CropSymbols = ({croppedSymbols, addCroppedSymbol, removeCroppedSymbol}) =>{

    return (
    <>
        <h2 className="text-xl font-semibold mb-4">Cropped Symbols</h2>
        <div className="grid grid-cols-2 items-center gap-2 mb-3 ">
          <div className="item-center ">
            <button  onClick={addCroppedSymbol}
            className="text-white text-3xl  bg-blue-700 hover:bg-blue-800 focus:outline-none font-medium rounded-lg px-4 py-2 text-center inline-flex items-center">
              +
            </button>
          </div>
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
    </>
    )
}

export default CropSymbols