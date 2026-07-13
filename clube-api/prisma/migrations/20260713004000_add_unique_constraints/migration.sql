-- CreateTable
CREATE UNIQUE INDEX "categories_name_unique" ON "categories"("name");

-- CreateTable
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateTable
CREATE UNIQUE INDEX "opponents_name_unique" ON "opponents"("name");

-- CreateTable
CREATE UNIQUE INDEX "transfer_clubs_name_unique" ON "transfer_clubs"("name");

-- CreateTable
CREATE UNIQUE INDEX "competitions_cat_name_season_unique" ON "competitions"("categoryId", "name", "season");

-- CreateTable
CREATE UNIQUE INDEX "match_comp_opp_date_unique" ON "Match"("competitionId", "opponentId", "date");

-- CreateTable
CREATE UNIQUE INDEX "oppcat_opp_cat_unique" ON "opponent_categories"("opponentId", "categoryId");

-- CreateTable
CREATE UNIQUE INDEX "standing_comp_pos_group_unique" ON "standing_entries"("competitionId", "position", "groupName");

-- CreateTable
CREATE UNIQUE INDEX "pm_sm_type_date_club_unique" ON "player_movements"("squadMemberId", "type", "date", "clubId");
