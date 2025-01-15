import React, { useState, useEffect } from 'react';
import ChessPiece from './ChessPiece';

const initialBoard = [
  ['Brook', 'Bknight', 'Bbishop', 'Bqueen', 'Bking', 'Bbishop', 'Bknight', 'Brook'],
  ['Bpawn', 'Bpawn', 'Bpawn', 'Bpawn', 'Bpawn', 'Bpawn', 'Bpawn', 'Bpawn'],
  Array(8).fill(''),
  Array(8).fill(''),
  Array(8).fill(''),
  Array(8).fill(''),
  ['Wpawn', 'Wpawn', 'Wpawn', 'Wpawn', 'Wpawn', 'Wpawn', 'Wpawn', 'Wpawn'],
  ['Wrook', 'Wknight', 'Wbishop', 'Wqueen', 'Wking', 'Wbishop', 'Wknight', 'Wrook'],
];

const ChessBoard = () => {
    const [board, setBoard] = useState(initialBoard);
    const [selectedPiece, setSelectedPiece] = useState(null);
    const [turn, setTurn] = useState('W');
    const [gameStatus, setGameStatus] = useState('ongoing');
    const [castlingRights, setCastlingRights] = useState({
      W: { kingSide: true, queenSide: true },
      B: { kingSide: true, queenSide: true },
    });
    const [enPassantTarget, setEnPassantTarget] = useState(null);
    const [capturedPieces, setCapturedPieces] = useState({ W: [], B: [] });
    const [promotionChoice, setPromotionChoice] = useState(null);

    useEffect(() => {
      checkGameStatus();
  }, [turn]);
  

    const handleClick = (row, col) => {
        if (gameStatus !== 'ongoing') return;

        if (selectedPiece) {
            if (isLegalMove(selectedPiece.row, selectedPiece.col, row, col)) {
                movePiece(row, col);
            } else {
                setSelectedPiece(null);
            }
        } else {
            const piece = board[row][col];
            if (piece && piece[0] === turn) {
                setSelectedPiece({ row, col, piece });
            }
        }
    };

    const movePiece = (toRow, toCol) => {
      const newBoard = board.map(row => [...row]); // Cria uma cópia do tabuleiro atual
      const [fromRow, fromCol] = [selectedPiece.row, selectedPiece.col];
      const movingPiece = selectedPiece.piece;
  
      // Determine the opponent's color
      const opponentColor = turn === 'W' ? 'B' : 'W';
  
      const capturedPiece = newBoard[toRow][toCol];
      if (capturedPiece) {
          setCapturedPieces(prev => ({
              ...prev,
              [capturedPiece[0]]: [...prev[capturedPiece[0]], capturedPiece],
          }));
      }
  
      // pawn promotion
      if ((movingPiece === 'Wpawn' && toRow === 0) || (movingPiece === 'Bpawn' && toRow === 7)) {
          newBoard[fromRow][fromCol] = ''; // Remove o peão da posição original
          newBoard[toRow][toCol] = movingPiece; // Move o peão para o destino
          setBoard(newBoard); // Atualiza o tabuleiro
          promptPromotion(movingPiece[0], toRow, toCol); // Inicia a promoção de peão
          return;
      }
  
      // movv
      newBoard[toRow][toCol] = movingPiece;
      newBoard[fromRow][fromCol] = '';
  
      // Handle castling
      if (movingPiece[1] === 'king' && Math.abs(fromCol - toCol) === 2) {
          const isKingSide = toCol > fromCol;
          const rookCol = isKingSide ? 7 : 0;
          const newRookCol = isKingSide ? 5 : 3;
          newBoard[toRow][newRookCol] = newBoard[toRow][rookCol];
          newBoard[toRow][rookCol] = '';
      }
  
      // Handle en passant
      if (
          movingPiece[1] === 'pawn' &&
          Math.abs(fromCol - toCol) === 1 &&
          newBoard[toRow][toCol] === ''
      ) {
          const capturedPawnRow = fromRow;
          newBoard[capturedPawnRow][toCol] = '';
          setCapturedPieces(prev => ({
              ...prev,
              [opponentColor]: [...prev[opponentColor], `${opponentColor}pawn`],
          }));
      }
  
      // Update castling rights
      updateCastlingRights(movingPiece, fromRow, fromCol);
  
      // Set en passant target
      setEnPassantTarget(
          movingPiece[1] === 'pawn' && Math.abs(fromRow - toRow) === 2
              ? { row: (fromRow + toRow) / 2, col: toCol }
              : null
      );
  
      setBoard(newBoard);
      setTurn(opponentColor); 
      setSelectedPiece(null); 
  };
  
  
  

    const promptPromotion = (color, toRow, toCol) => {
        setPromotionChoice(color);
        setSelectedPiece({ row: toRow, col: toCol, piece: `${color}pawn` });
    };

    const handlePromotion = (piece) => {
        if (!selectedPiece) return;

        const newBoard = board.map(row => [...row]);
        const [row, col] = [selectedPiece.row, selectedPiece.col];
        const newPiece = `${promotionChoice}${piece}`;
        newBoard[row][col] = newPiece;

        setBoard(newBoard);
        setTurn(turn === 'W' ? 'B' : 'W');
        setSelectedPiece(null);
        setPromotionChoice(null);
    };

    const isStraightMove = (startRow, startCol, endRow, endCol) => {
      if (startRow !== endRow && startCol !== endCol) return false;
  
      const stepRow = startRow === endRow ? 0 : (endRow > startRow ? 1 : -1);
      const stepCol = startCol === endCol ? 0 : (endCol > startCol ? 1 : -1);
  
      let row = startRow + stepRow;
      let col = startCol + stepCol;
      while (row !== endRow || col !== endCol) {
          if (board[row][col] !== '') return false;
          row += stepRow;
          col += stepCol;
      }
  
      return true;
  };
  
  const isDiagonalMove = (startRow, startCol, endRow, endCol) => {
      if (Math.abs(startRow - endRow) !== Math.abs(startCol - endCol)) return false;
  
      const stepRow = endRow > startRow ? 1 : -1;
      const stepCol = endCol > startCol ? 1 : -1;
  
      let row = startRow + stepRow;
      let col = startCol + stepCol;
      while (row !== endRow || col !== endCol) {
          if (board[row][col] !== '') return false;
          row += stepRow;
          col += stepCol;
      }
  
      return true;
  };

  const isLegalMove = (startRow, startCol, endRow, endCol) => {
    const piece = board[startRow][startCol];
    if (!piece) return false; 

    const color = piece[0]; 
    const type = piece.slice(1).toLowerCase(); 

    
    if (board[endRow][endCol] && board[endRow][endCol][0] === color) return false;

    let isLegal = false;

    switch (type) {
        case 'pawn': {
            const direction = color === 'W' ? -1 : 1; 
            const startingRow = color === 'W' ? 6 : 1;


            if (
                startCol === endCol && 
                board[endRow][endCol] === '' && 
                endRow === startRow + direction 
            ) {
                isLegal = true;
            }

            // initial pawn
            if (
                startCol === endCol &&
                startRow === startingRow && 
                endRow === startRow + 2 * direction && 
                board[startRow + direction][startCol] === '' && 
                board[endRow][endCol] === '' 
            ) {
                isLegal = true;
            }

            // diag
            if (
                Math.abs(startCol - endCol) === 1 && 
                endRow === startRow + direction && 
                board[endRow][endCol] !== '' 
            ) {
                isLegal = true;
            }
            if (Math.abs(startCol - endCol) === 1 && endRow === startRow + direction && 
                (board[endRow][endCol] !== '' || (enPassantTarget && enPassantTarget.row === endRow && enPassantTarget.col === endCol))) {
              return true;
            }

            break;
        }
        case 'rook':
            isLegal = isStraightMove(startRow, startCol, endRow, endCol); 
            break;
        case 'bishop':
            isLegal = isDiagonalMove(startRow, startCol, endRow, endCol); 
            break;
        case 'queen':
            isLegal = (
                isStraightMove(startRow, startCol, endRow, endCol) || 
                isDiagonalMove(startRow, startCol, endRow, endCol)   
            );
            break;
        case 'king':
            isLegal = (
                Math.abs(startRow - endRow) <= 1 && 
                Math.abs(startCol - endCol) <= 1    
            );
            break;
        case 'knight':
            isLegal = (
                (Math.abs(startRow - endRow) === 2 && Math.abs(startCol - endCol) === 1) || 
                (Math.abs(startRow - endRow) === 1 && Math.abs(startCol - endCol) === 2)    
            );
            break;
        default:
            isLegal = false; 
    }

    if (isLegal) {
        // Check if the move puts or leaves the king in check
        const tempBoard = board.map(row => [...row]);
        tempBoard[endRow][endCol] = tempBoard[startRow][startCol];
        tempBoard[startRow][startCol] = '';
        if (isKingInCheck(color, tempBoard)) {
            return false;
        }
    }

    return isLegal;
};

    const hasLegalMoves = (color, boardState = board) => {
      for (let startRow = 0; startRow < 8; startRow++) {
        for (let startCol = 0; startCol < 8; startCol++) {
          if (boardState[startRow][startCol][0] === color) {
            for (let endRow = 0; endRow < 8; endRow++) {
              for (let endCol = 0; endCol < 8; endCol++) {
                if (isLegalMove(startRow, startCol, endRow, endCol)) {
                  const tempBoard = boardState.map(row => [...row]);
                  tempBoard[endRow][endCol] = tempBoard[startRow][startCol];
                  tempBoard[startRow][startCol] = '';
                  
                  if (!isKingInCheck(color, tempBoard)) {
                    return true;
                  }
                }
              }
            }
          }
        }
      }
      return false;
    };

    const updateCastlingRights = (piece, fromRow, fromCol) => {
      const newCastlingRights = { ...castlingRights };
      const color = piece[0];

      if (piece[1] === 'king') {
        newCastlingRights[color].kingSide = false;
        newCastlingRights[color].queenSide = false;
      } else if (piece[1] === 'rook') {
        if (fromCol === 0) newCastlingRights[color].queenSide = false;
        if (fromCol === 7) newCastlingRights[color].kingSide = false;
      }

      setCastlingRights(newCastlingRights);
    };

  const checkGameStatus = () => {
    if (isKingInCheck(turn)) {
      if (!hasLegalMoves(turn)) {
        setGameStatus('checkmate');
      } else {
        setGameStatus('check');
      }
    } else if (!hasLegalMoves(turn)) {
      setGameStatus('stalemate');
    } else {
      setGameStatus('ongoing');
    }
  };

const CapturedPieces = ({ pieces, color }) => (
  <div className={`flex flex-wrap gap-1 ${color === 'W' ? 'justify-start' : 'justify-end'}`}>
    {pieces.map((piece, index) => (
      <div key={index} className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10">
        <ChessPiece piece={piece} />
      </div>
    ))}
  </div>
);

const isKingInCheck = (color, boardState = board) => {
  let kingRow, kingCol;
  for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
          if (boardState[row][col] === `${color}king`) {
              kingRow = row;
              kingCol = col;
              break;
          }
      }
  }

  return isSquareUnderAttack(kingRow, kingCol, color, boardState);
};


const isSquareUnderAttack = (row, col, defendingColor, boardState = board) => {
  const attackingColor = defendingColor === 'W' ? 'B' : 'W';
  for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
          if (boardState[r][c] && boardState[r][c][0] === attackingColor) {
              if (isLegalMove(r, c, row, col, boardState)) {
                  return true;
              }
          }
      }
  }
  return false;
};


return (
  <div className="flex flex-col items-center">
      <h2 className="text-lg sm:text-xl lg:text-2xl mb-4 font-bold text-red-500">
        {gameStatus === 'ongoing' ? `${turn === 'W' ? "White" : "Black"}'s Turn` :
         gameStatus === 'checkmate' ? `Checkmate! ${turn === 'W' ? "Black" : "White"} wins!` :
         gameStatus === 'stalemate' ? "Stalemate! The game is a draw." :
         `${turn === 'W' ? "White" : "Black"} is in check!`}
      </h2>
      <div className="w-full max-w-[80vw] mb-4">
        <CapturedPieces pieces={capturedPieces.W} color="W" />
      </div>
      <div className="grid grid-cols-8 gap-0.5">
          {board.map((row, rowIndex) =>
              row.map((piece, colIndex) => (
                  <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 flex items-center justify-center text-lg sm:text-2xl lg:text-3xl cursor-pointer
                          ${(rowIndex + colIndex) % 2 === 0 ? 'bg-amber-200' : 'bg-amber-800'}
                          ${selectedPiece &&
                          selectedPiece.row === rowIndex &&
                          selectedPiece.col === colIndex
                              ? 'bg-yellow-400'
                              : ''}
                          ${selectedPiece &&
                          isLegalMove(selectedPiece.row, selectedPiece.col, rowIndex, colIndex)
                              ? 'bg-green-400'
                              : ''}`}
                      onClick={() => handleClick(rowIndex, colIndex)}
                  >
                      <ChessPiece piece={piece} />
                  </div>
              ))
          )}
      </div>
      {promotionChoice && (
          <div className="mt-4 p-4 bg-gray-200 rounded shadow-md">
              <h3 className="text-lg font-semibold mb-2">
                  Select a piece to promote to:
              </h3>
              <div className="flex gap-2">
                  <button
                      onClick={() => handlePromotion('queen')}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                      Queen
                  </button>
                  <button
                      onClick={() => handlePromotion('rook')}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                      Rook
                  </button>
                  <button
                      onClick={() => handlePromotion('bishop')}
                      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                      Bishop
                  </button>
                  <button
                      onClick={() => handlePromotion('knight')}
                      className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                      Knight
                  </button>
              </div>
          </div>
      )}
      <div className="w-full max-w-[80vw] mt-4">
        <CapturedPieces pieces={capturedPieces.B} color="B" />
      </div>
  </div>
);

};
export default ChessBoard;
