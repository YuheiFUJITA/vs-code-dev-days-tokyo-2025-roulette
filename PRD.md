# Event Lottery Application PRD

VS Code Meet Up event lottery system that randomly selects attendees from CSV participant data.

**Experience Qualities**:
1. **Efficient** - Quickly process CSV data and perform instant lottery draws
2. **Transparent** - Clear visual feedback showing selection criteria and results
3. **Reliable** - Prevent duplicate selections and maintain fair lottery process

**Complexity Level**: Light Application (multiple features with basic state)
- Handles CSV parsing, filtering logic, random selection, and winner tracking

## Essential Features

### CSV Data Import
- **Functionality**: Parse CSV text input with Japanese headers for event participant data
- **Purpose**: Load participant information for lottery processing
- **Trigger**: User pastes CSV data into textarea and clicks import
- **Progression**: Paste CSV → Parse headers → Validate data → Display participant count → Ready for lottery
- **Success criteria**: Successfully parse and display number of eligible participants

### Lottery Execution
- **Functionality**: Randomly select one eligible participant from filtered dataset
- **Purpose**: Fair selection of winner from attendees excluding staff
- **Trigger**: Click "抽選実行" (Execute Lottery) button
- **Progression**: Click button → Filter eligible users → Random selection → Display winner → Update winner list
- **Success criteria**: Display winner in format "運営枠（ユーザー名）" and prevent future selection

### Winner Management
- **Functionality**: Track previously selected winners to prevent duplicates
- **Purpose**: Ensure fair lottery with no repeat winners
- **Trigger**: Automatic after each lottery execution
- **Progression**: Winner selected → Add to winner list → Remove from eligible pool → Display winner history
- **Success criteria**: Winners cannot be selected again in subsequent draws

### Multiple Lottery Rounds
- **Functionality**: Allow multiple lottery executions until eligible pool is exhausted
- **Purpose**: Select multiple winners for different prizes or positions
- **Trigger**: Repeated clicks of lottery button
- **Progression**: Execute lottery → Show result → Update pool → Enable next round → Continue until pool empty
- **Success criteria**: Can perform multiple rounds with decreasing eligible participant count

## Edge Case Handling

- **Empty CSV Data**: Display helpful message to paste CSV data first
- **Invalid CSV Format**: Show error message with expected header format
- **No Eligible Participants**: Display message when no attendees meet criteria
- **All Participants Selected**: Disable lottery button and show completion message
- **Malformed CSV Rows**: Skip invalid rows and continue processing valid data

## Design Direction

Clean, professional interface with Japanese text support that feels trustworthy and ceremonial for official event lottery draws.

## Color Selection

Analogous (adjacent colors on color wheel) - Using professional blue tones to convey trust and reliability appropriate for official event management.

- **Primary Color**: Professional Blue (oklch(0.55 0.15 240)) - Conveys trust and official ceremony
- **Secondary Colors**: Light Blue backgrounds (oklch(0.95 0.05 240)) for data display areas
- **Accent Color**: Success Green (oklch(0.65 0.15 130)) for lottery results and winner announcements
- **Foreground/Background Pairings**: 
  - Background (White oklch(1 0 0)): Dark text (oklch(0.15 0 0)) - Ratio 13.9:1 ✓
  - Primary (Professional Blue oklch(0.55 0.15 240)): White text (oklch(1 0 0)) - Ratio 6.8:1 ✓
  - Accent (Success Green oklch(0.65 0.15 130)): White text (oklch(1 0 0)) - Ratio 5.2:1 ✓
  - Card (Light Gray oklch(0.98 0 0)): Dark text (oklch(0.15 0 0)) - Ratio 13.2:1 ✓

## Font Selection

Professional Japanese-compatible typeface that maintains readability for both Japanese and English text in official contexts.

- **Typographic Hierarchy**: 
  - H1 (App Title): Noto Sans JP Bold/32px/tight letter spacing
  - H2 (Section Headers): Noto Sans JP SemiBold/24px/normal spacing  
  - Body (Instructions): Noto Sans JP Regular/16px/relaxed line height
  - Results (Winner Display): Noto Sans JP Bold/20px/emphasized

## Animations

Subtle ceremonial feel appropriate for official lottery draws with brief celebratory moments upon winner selection.

- **Purposeful Meaning**: Smooth transitions convey professionalism while brief celebrations acknowledge lottery excitement
- **Hierarchy of Movement**: Winner reveal gets attention-drawing animation, data processing shows subtle loading states

## Component Selection

- **Components**: Card for data display areas, Button for lottery execution, Textarea for CSV input, Badge for status indicators, Separator for content sections
- **Customizations**: Custom lottery result component with emphasis styling, Japanese text optimization
- **States**: Disabled lottery button when no eligible participants, loading state during processing, success state for winners
- **Icon Selection**: Play icon for lottery execution, CheckCircle for winners, Upload for CSV import
- **Spacing**: Generous padding (p-6) for main content areas, comfortable gaps (gap-4) between elements
- **Mobile**: Single column layout with full-width components, touch-friendly button sizes, readable text scaling