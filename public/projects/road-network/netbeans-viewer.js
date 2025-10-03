// NetBeans IDE viewer with syntax highlighting
const playerCode = `<span class="keyword">package</span> Tictactoe;

<span class="keyword">public</span> <span class="keyword">class</span> <span class="class">Player</span>
{
<span class="comment">//Fields - Class Variables</span>

    <span class="keyword">private</span> <span class="class">String</span> <span class="variable">playerName</span> = <span class="string">""</span>;
    <span class="keyword">private</span> <span class="keyword">char</span> <span class="variable">playerMarker</span> = <span class="string">' '</span>;
    <span class="keyword">private</span> <span class="keyword">int</span> <span class="variable">playerBoardTotal</span> = <span class="number">0</span>;
    <span class="keyword">private</span> <span class="keyword">int</span> <span class="variable">playerTotalWins</span> = <span class="number">0</span>;

    <span class="keyword">public</span> <span class="method">Player</span>(<span class="class">String</span> <span class="variable">playerName</span>)
    {
        <span class="keyword">this</span>.<span class="variable">playerName</span> = <span class="variable">playerName</span>;

    }

    <span class="keyword">public</span> <span class="class">String</span> <span class="method">getPlayerName</span>()
    {
        <span class="keyword">return</span> <span class="variable">playerName</span>;
    }

    <span class="keyword">public</span> <span class="keyword">char</span> <span class="method">getPlayerMarker</span>()
    {
        <span class="keyword">return</span> <span class="variable">playerMarker</span>;
    }

<span class="comment">//Sets X or O</span>
    <span class="keyword">public</span> <span class="keyword">void</span> <span class="method">setPlayerMarker</span>(<span class="keyword">char</span> <span class="variable">marker</span>)
    {
        <span class="keyword">this</span>.<span class="variable">playerMarker</span> = <span class="variable">marker</span>;
    }

    <span class="keyword">public</span> <span class="keyword">int</span> <span class="method">getPlayerBoardTotal</span>()
    {
        <span class="keyword">return</span> <span class="variable">playerBoardTotal</span>;
    }

    <span class="keyword">public</span> <span class="keyword">void</span> <span class="method">addPlayerBoardTotal</span>(<span class="keyword">int</span> <span class="variable">bitValue</span>)
    {
        <span class="keyword">this</span>.<span class="variable">playerBoardTotal</span> = <span class="keyword">this</span>.<span class="variable">playerBoardTotal</span> + <span class="variable">bitValue</span>;
    }

    <span class="keyword">public</span> <span class="keyword">int</span> <span class="method">getPlayerTotalWins</span>()
    {
        <span class="keyword">return</span> <span class="variable">playerTotalWins</span>;
    }

    <span class="keyword">public</span> <span class="keyword">void</span> <span class="method">addPlayerTotalWins</span>()
    {
        <span class="keyword">this</span>.<span class="variable">playerTotalWins</span>++;
    }

    <span class="keyword">public</span> <span class="keyword">void</span> <span class="method">resetPlayerTotal</span>()
    {
        <span class="variable">playerBoardTotal</span> = <span class="number">0</span>;
    }

}`;

const tictactoeCode = `<span class="keyword">package</span> Tictactoe;

<span class="keyword">import</span> java.awt.GridLayout;
<span class="keyword">import</span> java.awt.event.ActionEvent;
<span class="keyword">import</span> java.awt.event.ActionListener;
<span class="keyword">import</span> javax.swing.*;

<span class="keyword">public</span> <span class="keyword">class</span> <span class="class">Tictactoe</span> <span class="keyword">extends</span> <span class="class">JFrame</span> <span class="keyword">implements</span> <span class="class">ActionListener</span>
{

    <span class="keyword">private</span> <span class="keyword">static</span> <span class="class">Player</span> <span class="variable">player1</span>;
    <span class="keyword">private</span> <span class="keyword">static</span> <span class="class">Player</span> <span class="variable">player2</span>;
    <span class="keyword">private</span> <span class="keyword">static</span> <span class="class">Player</span> <span class="variable">cat</span>;
   
    
    <span class="keyword">private</span> <span class="class">JLabel</span> <span class="variable">player1score</span>;
    <span class="keyword">private</span> <span class="class">JLabel</span> <span class="variable">player2score</span>;
    <span class="keyword">private</span> <span class="class">JLabel</span> <span class="variable">catScore</span>;
    
    <span class="keyword">private</span> <span class="keyword">static</span> <span class="keyword">boolean</span> <span class="variable">xTurn</span> = <span class="keyword">true</span>;
    
   

    <span class="comment">// Holds all 9 buttons on board</span>
    <span class="keyword">private</span> <span class="keyword">static</span> <span class="class">JButton</span>[] <span class="variable">buttonArray</span> = <span class="keyword">new</span> <span class="class">JButton</span>[<span class="number">9</span>];

<span class="comment">// Holds bit patterns of winning cells shown as decimals</span>
    <span class="keyword">private</span> <span class="keyword">static</span> <span class="keyword">int</span>[] <span class="variable">winsArray</span> =
    {
        <span class="number">7</span>, <span class="number">56</span>, <span class="number">73</span>, <span class="number">84</span>, <span class="number">146</span>, <span class="number">273</span>, <span class="number">292</span>, <span class="number">448</span>
    };

    <span class="keyword">public</span> <span class="method">Tictactoe</span>()
    {
        <span class="variable">player1</span> = <span class="keyword">new</span> <span class="class">Player</span>(<span class="string">"cob"</span>);
        <span class="variable">player2</span> = <span class="keyword">new</span> <span class="class">Player</span>(<span class="string">"basu"</span>);
        <span class="variable">cat</span> = <span class="keyword">new</span> <span class="class">Player</span>(<span class="string">"CAT"</span>);

        <span class="variable">player1</span>.<span class="method">setPlayerMarker</span>(<span class="string">'X'</span>);
        <span class="variable">player2</span>.<span class="method">setPlayerMarker</span>(<span class="string">'O'</span>);

        <span class="class">JPanel</span> <span class="variable">gameBoard</span> = <span class="keyword">new</span> <span class="class">JPanel</span>();
        <span class="variable">gameBoard</span>.<span class="method">setLayout</span>(<span class="keyword">new</span> <span class="class">GridLayout</span>(<span class="number">6</span>, <span class="number">3</span>, <span class="number">5</span>, <span class="number">5</span>));

        <span class="comment">// Load button Array</span>
        <span class="keyword">int</span> <span class="variable">myBinary</span> = <span class="number">1</span>; <span class="comment">// for button totals</span>
        <span class="keyword">for</span> (<span class="keyword">int</span> <span class="variable">index</span> = <span class="number">0</span>; <span class="variable">index</span> < <span class="number">9</span>; <span class="variable">index</span>++)
        {
<span class="comment">// Create buttons</span>
            <span class="variable">buttonArray</span>[<span class="variable">index</span>] = <span class="keyword">new</span> <span class="class">JButton</span>();

<span class="comment">// Add the listner</span>
            <span class="variable">buttonArray</span>[<span class="variable">index</span>].<span class="method">addActionListener</span>(<span class="keyword">this</span>);

<span class="comment">// Set bit number on buttons</span>
            <span class="variable">buttonArray</span>[<span class="variable">index</span>].<span class="method">setActionCommand</span>(<span class="string">""</span> + <span class="variable">myBinary</span>);
            <span class="variable">myBinary</span> = <span class="variable">myBinary</span> * <span class="number">2</span>;

<span class="comment">// Add gameboard buttons</span>
            <span class="variable">gameBoard</span>.<span class="method">add</span>(<span class="variable">buttonArray</span>[<span class="variable">index</span>]);
        }<span class="comment">//loop</span>
        
        <span class="comment">//Scoreboard labels</span>
<span class="variable">gameBoard</span>.<span class="method">add</span>(<span class="keyword">new</span> <span class="class">JLabel</span>(<span class="string">"Player 1"</span>));
<span class="variable">gameBoard</span>.<span class="method">add</span>(<span class="keyword">new</span> <span class="class">JLabel</span>(<span class="variable">player1</span>.<span class="method">getPlayerName</span>()));
<span class="variable">player1score</span> = <span class="keyword">new</span> <span class="class">JLabel</span>(); <span class="comment">// Instanciate</span>
<span class="variable">gameBoard</span>.<span class="method">add</span>(<span class="variable">player1score</span>);<span class="comment">// Add to panel</span>

<span class="comment">//player2</span>
<span class="variable">gameBoard</span>.<span class="method">add</span>(<span class="keyword">new</span> <span class="class">JLabel</span>(<span class="string">"Player 2"</span>));
<span class="variable">gameBoard</span>.<span class="method">add</span>(<span class="keyword">new</span> <span class="class">JLabel</span>(<span class="variable">player2</span>.<span class="method">getPlayerName</span>()));
<span class="variable">player2score</span> = <span class="keyword">new</span> <span class="class">JLabel</span>(); <span class="comment">// Instanciate</span>
<span class="variable">gameBoard</span>.<span class="method">add</span>(<span class="variable">player2score</span>);<span class="comment">// Add to panel</span>


<span class="comment">//cat</span>
<span class="variable">gameBoard</span>.<span class="method">add</span>(<span class="keyword">new</span> <span class="class">JLabel</span>(<span class="string">"Ties"</span>));
<span class="variable">gameBoard</span>.<span class="method">add</span>(<span class="keyword">new</span> <span class="class">JLabel</span>(<span class="variable">cat</span>.<span class="method">getPlayerName</span>()));
<span class="variable">catScore</span> = <span class="keyword">new</span> <span class="class">JLabel</span>(); <span class="comment">// Instanciate</span>
<span class="variable">gameBoard</span>.<span class="method">add</span>(<span class="variable">catScore</span>);<span class="comment">// Add to panel</span>
        
        <span class="method">setTitle</span>(<span class="string">"lakota's TicTacToe Game"</span>);
        <span class="keyword">this</span>.<span class="method">setLocationRelativeTo</span>(<span class="keyword">null</span>);
        <span class="keyword">this</span>.<span class="method">add</span>(<span class="variable">gameBoard</span>);
        <span class="keyword">this</span>.<span class="method">setSize</span>(<span class="number">400</span>, <span class="number">400</span>);
        <span class="keyword">this</span>.<span class="method">setDefaultCloseOperation</span>(<span class="variable">EXIT_ON_CLOSE</span>);

    }<span class="comment">//constructor close</span>

    <span class="annotation">@Override</span>
    <span class="keyword">public</span> <span class="keyword">void</span> <span class="method">actionPerformed</span>(<span class="class">ActionEvent</span> <span class="variable">button</span>)
    {
        <span class="class">JButton</span> <span class="variable">pressedButton</span> = (<span class="class">JButton</span>) <span class="variable">button</span>.<span class="method">getSource</span>();
        <span class="keyword">if</span> (<span class="variable">pressedButton</span>.<span class="method">getText</span>() == <span class="string">""</span>)
        {
            <span class="keyword">if</span> (<span class="variable">xTurn</span>)
            {<span class="comment">// x turn</span>
                <span class="variable">pressedButton</span>.<span class="method">setText</span>(<span class="string">"X"</span>);
                <span class="variable">xTurn</span> = <span class="keyword">false</span>;
                <span class="variable">player1</span>.<span class="method">addPlayerBoardTotal</span>(<span class="class">Integer</span>.<span class="method">parseInt</span>(<span class="variable">pressedButton</span>.<span class="method">getActionCommand</span>()));
                <span class="keyword">if</span> (<span class="method">check4winner</span>(<span class="variable">player1</span>.<span class="method">getPlayerBoardTotal</span>()))
                {
                    <span class="variable">player1</span>.<span class="method">addPlayerTotalWins</span>();
                     <span class="variable">player1score</span>.<span class="method">setText</span>(<span class="string">""</span> + <span class="variable">player1</span>.<span class="method">getPlayerTotalWins</span>());
                    <span class="method">resetGame</span>();
                }<span class="comment">// Check4winner</span>
            } <span class="keyword">else</span>

            {<span class="comment">// o turn</span>
                <span class="variable">pressedButton</span>.<span class="method">setText</span>(<span class="string">"O"</span>);

                <span class="variable">xTurn</span> = <span class="keyword">true</span>;
                <span class="variable">player2</span>.<span class="method">addPlayerBoardTotal</span>(<span class="class">Integer</span>.<span class="method">parseInt</span>(<span class="variable">pressedButton</span>.<span class="method">getActionCommand</span>()));
                <span class="keyword">if</span> (<span class="method">check4winner</span>(<span class="variable">player2</span>.<span class="method">getPlayerBoardTotal</span>()))

                {
                    <span class="variable">player2</span>.<span class="method">addPlayerTotalWins</span>();
                    <span class="variable">player2score</span>.<span class="method">setText</span>(<span class="string">""</span> + <span class="variable">player2</span>.<span class="method">getPlayerTotalWins</span>());
                    <span class="method">resetGame</span>();
                }<span class="comment">// Check4winner</span>

            }
        
    

 <span class="comment">//cat</span>
            <span class="keyword">if</span> (<span class="variable">player1</span>.<span class="method">getPlayerBoardTotal</span>() + <span class="variable">player2</span>.<span class="method">getPlayerBoardTotal</span>() == <span class="number">511</span>)
            {
                <span class="variable">cat</span>.<span class="method">addPlayerTotalWins</span>();
                <span class="variable">catScore</span>.<span class="method">setText</span>(<span class="string">""</span> + <span class="variable">cat</span>.<span class="method">getPlayerTotalWins</span>());
                <span class="method">resetGame</span>();

            }

        }
    }
   
<span class="keyword">public</span> <span class="keyword">static</span> <span class="keyword">boolean</span> <span class="method">check4winner</span>(<span class="keyword">int</span> <span class="variable">total</span>)
    {
        <span class="keyword">for</span> (<span class="keyword">int</span> <span class="variable">index</span> = <span class="number">0</span>; <span class="variable">index</span> < <span class="variable">winsArray</span>.<span class="variable">length</span>; <span class="variable">index</span>++)
        {
            <span class="class">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="variable">winsArray</span>[<span class="variable">index</span>] + <span class="string">" "</span> + <span class="variable">total</span>);
<span class="comment">//compare the wins Array occurance bitwise to the current total</span>

            <span class="keyword">if</span> ((<span class="variable">winsArray</span>[<span class="variable">index</span>] & <span class="variable">total</span>) == <span class="variable">winsArray</span>[<span class="variable">index</span>])
            {
                <span class="class">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"true"</span>);
                <span class="keyword">return</span> <span class="keyword">true</span>;
            }
        }

        <span class="class">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"false"</span>);
        <span class="keyword">return</span> <span class="keyword">false</span>;
    }<span class="comment">//check</span>

    <span class="keyword">public</span> <span class="keyword">static</span> <span class="keyword">void</span> <span class="method">resetGame</span>()
    {
        <span class="keyword">for</span> (<span class="class">JButton</span> <span class="variable">buttonArray1</span> : <span class="variable">buttonArray</span>)
        {
            <span class="variable">buttonArray1</span>.<span class="method">setText</span>(<span class="string">""</span>);
        }
        <span class="variable">player1</span>.<span class="method">resetPlayerTotal</span>();
        <span class="variable">player2</span>.<span class="method">resetPlayerTotal</span>();
    }<span class="comment">//reset</span>

    <span class="keyword">public</span> <span class="keyword">static</span> <span class="keyword">void</span> <span class="method">main</span>(<span class="class">String</span>[] <span class="variable">args</span>)
    {
        <span class="class">Tictactoe</span> <span class="variable">window</span> = <span class="keyword">new</span> <span class="class">Tictactoe</span>();
        <span class="variable">window</span>.<span class="method">setVisible</span>(<span class="keyword">true</span>);

    }
}`;

let currentTab = 'tictactoe';

// Function to switch tabs
function showTab(tab) {
    const codeContent = document.getElementById('codeContent');
    const lineNumbers = document.getElementById('lineNumbers');
    const tabs = document.querySelectorAll('.tab');
    
    // Update active tab
    tabs.forEach(t => t.classList.remove('active'));
    if (tab === 'tictactoe') {
        tabs[0].classList.add('active');
        codeContent.innerHTML = tictactoeCode;
        // Generate line numbers for Tictactoe
        let lineNumbersText = '';
        for (let i = 1; i <= 172; i++) {
            lineNumbersText += i + '\n';
        }
        lineNumbers.textContent = lineNumbersText;
    } else if (tab === 'player') {
        tabs[1].classList.add('active');
        codeContent.innerHTML = playerCode;
        // Generate line numbers for Player
        let lineNumbersText = '';
        for (let i = 1; i <= 60; i++) {
            lineNumbersText += i + '\n';
        }
        lineNumbers.textContent = lineNumbersText;
    }
    
    currentTab = tab;
}

// Load code and line numbers
document.addEventListener('DOMContentLoaded', function() {
    const codeContent = document.getElementById('codeContent');
    const lineNumbers = document.getElementById('lineNumbers');
    
    // Set the default code content with syntax highlighting (Tictactoe)
    codeContent.innerHTML = tictactoeCode;
    
    // Generate line numbers - one per line
    let lineNumbersText = '';
    for (let i = 1; i <= 172; i++) {  // Java file has 172 lines
        lineNumbersText += i + '\n';
    }
    lineNumbers.textContent = lineNumbersText;
    
    // Sync scroll between line numbers and code
    codeContent.addEventListener('scroll', function() {
        lineNumbers.scrollTop = codeContent.scrollTop;
    });
});