"""
Simple and Easy X and O (Tic Tac Toe) Game in Python
Run with: python game.py
"""

import random

def print_board(board):
    print("\n")
    print(f" {board[0]} | {board[1]} | {board[2]} ")
    print("---+---+---")
    print(f" {board[3]} | {board[4]} | {board[5]} ")
    print("---+---+---")
    print(f" {board[6]} | {board[7]} | {board[8]} ")
    print("\n")

def check_win(board, player):
    win_combos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], # Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], # Columns
        [0, 4, 8], [2, 4, 6]             # Diagonals
    ]
    return any(all(board[i] == player for i in combo) for combo in win_combos)

def is_draw(board):
    return all(space in ['X', 'O'] for space in board)

def get_computer_move(board):
    # Available spots
    available = [i for i, spot in enumerate(board) if spot not in ['X', 'O']]
    
    # 1. Can computer win?
    for spot in available:
        temp = board[:]
        temp[spot] = 'O'
        if check_win(temp, 'O'):
            return spot
            
    # 2. Can player win? Block them
    for spot in available:
        temp = board[:]
        temp[spot] = 'X'
        if check_win(temp, 'X'):
            return spot
            
    # 3. Take center if available
    if 4 in available:
        return 4
        
    # 4. Pick random available spot
    return random.choice(available)

def play_game():
    print("====================================")
    print("      Welcome to X and O Game!      ")
    print("====================================")
    print("Select Mode:")
    print("1. 👥 2 Players (Pass & Play)")
    print("2. 🤖 vs Computer")
    
    mode = input("Enter choice (1 or 2, default is 2): ").strip()
    vs_computer = (mode != '1')
    
    while True:
        # Numbered 1-9 initially for ease of reference
        board = [str(i) for i in range(1, 10)]
        current_player = 'X'
        
        while True:
            print_board(board)
            
            if current_player == 'X' or not vs_computer:
                prompt = f"Player {current_player}, choose a position (1-9): "
                user_input = input(prompt).strip()
                
                if not user_input.isdigit() or int(user_input) not in range(1, 10):
                    print("Invalid input! Please choose an available number from 1 to 9.")
                    continue
                    
                pos = int(user_input) - 1
                if board[pos] in ['X', 'O']:
                    print("That position is already taken! Pick another.")
                    continue
            else:
                print("Computer (O) is thinking...")
                pos = get_computer_move(board)
                print(f"Computer chose position {pos + 1}!")
            
            board[pos] = current_player
            
            if check_win(board, current_player):
                print_board(board)
                if vs_computer and current_player == 'O':
                    print("🤖 Computer wins! Better luck next time.")
                else:
                    print(f"🎉 Congratulations! Player {current_player} wins!")
                break
                
            if is_draw(board):
                print_board(board)
                print("🤝 It's a draw!")
                break
                
            current_player = 'O' if current_player == 'X' else 'X'
            
        replay = input("\nPlay again? (y/n): ").strip().lower()
        if replay != 'y':
            print("Thanks for playing! Goodbye!")
            break

if __name__ == "__main__":
    play_game()
